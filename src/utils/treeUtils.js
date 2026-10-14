// Utility functions for family tree calculations and data manipulation

// Calculate generation levels relative to 'me' node
export const updateGenerations = (members, meId = 'me') => {
  const memberMap = new Map(members.map(m => [m.id, { ...m }]));
  const visited = new Set();

  const me = memberMap.get(meId);
  if (me) {
    if (me.generation === undefined) me.generation = 0;
    visited.add(meId);
    
    // Queue for BFS traversal
    const queue = [meId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = memberMap.get(currentId);
      if (!current) continue;
      
      const gen = current.generation ?? 0;

      // Parents -> gen + 1 (Ancestors)
      [current.fatherId, current.motherId].forEach(parentId => {
        if (parentId && memberMap.has(parentId)) {
          const parent = memberMap.get(parentId);
          if (!visited.has(parentId)) {
            if (parent.generation === undefined || parent.generation === null) {
              parent.generation = gen + 1;
            }
            visited.add(parentId);
            queue.push(parentId);
          }
        }
      });

      // Spouse -> same gen
      if (current.spouseId && memberMap.has(current.spouseId)) {
        const spouse = memberMap.get(current.spouseId);
        if (!visited.has(current.spouseId)) {
          if (spouse.generation === undefined || spouse.generation === null) {
            spouse.generation = gen;
          }
          visited.add(current.spouseId);
          queue.push(current.spouseId);
        }
      }

      // Siblings -> same gen
      (current.siblingIds || []).forEach(sibId => {
        if (sibId && memberMap.has(sibId)) {
          const sibling = memberMap.get(sibId);
          if (!visited.has(sibId)) {
            if (sibling.generation === undefined || sibling.generation === null) {
              sibling.generation = gen;
            }
            visited.add(sibId);
            queue.push(sibId);
          }
        }
      });

      // Children -> gen - 1 (Descendants)
      (current.childrenIds || []).forEach(childId => {
        if (childId && memberMap.has(childId)) {
          const child = memberMap.get(childId);
          if (!visited.has(childId)) {
            if (child.generation === undefined || child.generation === null) {
              child.generation = gen - 1;
            }
            visited.add(childId);
            queue.push(childId);
          }
        }
      });
    }
  }

  // Preserve any explicitly set generation numbers
  return Array.from(memberMap.values()).map(m => ({
    ...m,
    generation: m.generation !== undefined && m.generation !== null ? parseInt(m.generation) : 0
  }));
};


// Generate JSON export
export const exportToJSON = (members) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `family_tree_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Simple GEDCOM Exporter
export const exportToGEDCOM = (members) => {
  let gedcom = "0 HEAD\n1 SOUR FamilyTreePro\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n";
  
  // Add Individuals
  members.forEach(m => {
    gedcom += `0 @I${m.id}@ INDI\n`;
    gedcom += `1 NAME ${m.name.replace('/', '')} /${m.maidenName || ''}/\n`;
    gedcom += `1 SEX ${m.gender === 'male' ? 'M' : m.gender === 'female' ? 'F' : 'U'}\n`;
    if (m.birthYear || m.birthPlace) {
      gedcom += `1 BIRT\n`;
      if (m.birthYear) gedcom += `2 DATE ${m.birthYear}\n`;
      if (m.birthPlace) gedcom += `2 PLAC ${m.birthPlace}\n`;
    }
    if (m.isDeceased || m.deathYear) {
      gedcom += `1 DEAT\n`;
      if (m.deathYear) gedcom += `2 DATE ${m.deathYear}\n`;
      if (m.deathPlace) gedcom += `2 PLAC ${m.deathPlace}\n`;
    }
    if (m.occupation) {
      gedcom += `1 OCCU ${m.occupation}\n`;
    }
    if (m.bio) {
      gedcom += `1 NOTE ${m.bio.replace(/\n/g, ' ')}\n`;
    }
  });

  // Add Families
  const famMap = new Map();
  members.forEach(m => {
    if (m.fatherId || m.motherId) {
      const famKey = `${m.fatherId || 'UNKNOWN'}_${m.motherId || 'UNKNOWN'}`;
      if (!famMap.has(famKey)) {
        famMap.set(famKey, { fatherId: m.fatherId, motherId: m.motherId, children: [] });
      }
      famMap.get(famKey).children.push(m.id);
    }
  });

  let famIdx = 1;
  famMap.forEach((fam) => {
    gedcom += `0 @F${famIdx}@ FAM\n`;
    if (fam.fatherId) gedcom += `1 HUSB @I${fam.fatherId}@\n`;
    if (fam.motherId) gedcom += `1 WIFE @I${fam.motherId}@\n`;
    fam.children.forEach(cId => {
      gedcom += `1 CHIL @I${cId}@\n`;
    });
    famIdx++;
  });


  gedcom += "0 TRLR\n";

  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(gedcom);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `family_tree_${new Date().toISOString().slice(0,10)}.ged`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Determine which side of the family (father's / paternal or mother's / maternal) each member belongs to relative to 'me'
 */
export const calculateFamilySides = (members, meId = 'me') => {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const sideMap = new Map();

  const me = memberMap.get(meId) || members.find(m => m.id === 'me') || members[0];
  if (!me) return sideMap;

  // Root person belongs to both sides
  sideMap.set(me.id, 'both');

  // Detect father and mother IDs (even if not explicitly reciprocated)
  let fatherId = me.fatherId;
  let motherId = me.motherId;

  if (!fatherId) {
    const foundF = members.find(m => 
      (m.childrenIds && m.childrenIds.includes(me.id) && m.gender === 'male') ||
      (m.relationToMe && m.relationToMe.toLowerCase().includes('father') && !m.relationToMe.toLowerCase().includes('grand'))
    );
    if (foundF) fatherId = foundF.id;
  }

  if (!motherId) {
    const foundM = members.find(m => 
      (m.childrenIds && m.childrenIds.includes(me.id) && m.gender === 'female') ||
      (m.relationToMe && m.relationToMe.toLowerCase().includes('mother') && !m.relationToMe.toLowerCase().includes('grand'))
    );
    if (foundM) motherId = foundM.id;
  }

  // Mark root's spouse and direct descendants as 'both'
  const markBothDescendants = (rootNodeId) => {
    const queue = [rootNodeId];
    const visited = new Set();
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id || visited.has(id) || !memberMap.has(id)) continue;
      visited.add(id);
      sideMap.set(id, 'both');
      const m = memberMap.get(id);
      if (m.spouseId && m.id === me.id) {
        sideMap.set(m.spouseId, 'both');
      }
      (m.childrenIds || []).forEach(cId => queue.push(cId));
    }
  };
  markBothDescendants(me.id);

  // Root's siblings share both parents, so they belong to 'both'
  (me.siblingIds || []).forEach(sId => {
    if (memberMap.has(sId)) {
      sideMap.set(sId, 'both');
    }
  });

  // TRAVERSE PATERNAL LINEAGE (FATHER'S SIDE)
  // Visited set excludes 'me' and explicitly blocks jumping to mother's side
  const paternalVisited = new Set([me.id]);
  if (motherId) paternalVisited.add(motherId);

  const traversePaternal = (startId) => {
    const queue = [startId];
    while (queue.length > 0) {
      const currId = queue.shift();
      if (!currId || paternalVisited.has(currId) || !memberMap.has(currId)) continue;
      paternalVisited.add(currId);
      
      // Mark as father's side
      sideMap.set(currId, 'father');

      const m = memberMap.get(currId);

      // Parents of this ancestor
      if (m.fatherId) queue.push(m.fatherId);
      if (m.motherId) queue.push(m.motherId);

      // Siblings (uncles, aunts, great-uncles, etc.)
      (m.siblingIds || []).forEach(sId => queue.push(sId));

      // Spouse: only if NOT the mother of 'me'!
      if (m.spouseId && m.spouseId !== motherId && !paternalVisited.has(m.spouseId)) {
        queue.push(m.spouseId);
      }

      // Children: only if not 'me' or children of 'me'
      (m.childrenIds || []).forEach(cId => {
        if (cId !== me.id && !paternalVisited.has(cId) && sideMap.get(cId) !== 'both') {
          queue.push(cId);
        }
      });
    }
  };

  // TRAVERSE MATERNAL LINEAGE (MOTHER'S SIDE)
  // Visited set excludes 'me' and explicitly blocks jumping to father's side
  const maternalVisited = new Set([me.id]);
  if (fatherId) maternalVisited.add(fatherId);

  const traverseMaternal = (startId) => {
    const queue = [startId];
    while (queue.length > 0) {
      const currId = queue.shift();
      if (!currId || maternalVisited.has(currId) || !memberMap.has(currId)) continue;
      maternalVisited.add(currId);

      // Mark as mother's side
      sideMap.set(currId, 'mother');

      const m = memberMap.get(currId);

      // Parents of this ancestor
      if (m.fatherId) queue.push(m.fatherId);
      if (m.motherId) queue.push(m.motherId);

      // Siblings (maternal uncles, aunts, etc.)
      (m.siblingIds || []).forEach(sId => queue.push(sId));

      // Spouse: only if NOT the father of 'me'!
      if (m.spouseId && m.spouseId !== fatherId && !maternalVisited.has(m.spouseId)) {
        queue.push(m.spouseId);
      }

      // Children: only if not 'me' or children of 'me'
      (m.childrenIds || []).forEach(cId => {
        if (cId !== me.id && !maternalVisited.has(cId) && sideMap.get(cId) !== 'both') {
          queue.push(cId);
        }
      });
    }
  };

  if (fatherId) traversePaternal(fatherId);
  if (motherId) traverseMaternal(motherId);

  // Fallback for any members that have explicit side or relation cues
  members.forEach(m => {
    if (sideMap.has(m.id)) return;
    const rel = (m.relationToMe || '').toLowerCase();
    const sideProp = (m.side || '').toLowerCase();
    if (sideProp === 'father' || sideProp === 'paternal' || rel.includes('paternal') || rel.includes('father')) {
      sideMap.set(m.id, 'father');
    } else if (sideProp === 'mother' || sideProp === 'maternal' || rel.includes('maternal') || rel.includes('mother')) {
      sideMap.set(m.id, 'mother');
    } else {
      sideMap.set(m.id, 'both');
    }
  });

  return sideMap;
};

/**
 * Resolves exact human-readable relationship description for any member
 * e.g., "💍 Wife of John", "👦 Brother of Mary", "👧 Sister of Mary", etc.
 */
export const resolveDetailedRelationship = (member, members, rootId = 'me') => {
  if (!member) return { relationLabel: 'Relative', relationCategory: 'relative' };
  
  const memberMap = new Map(members.map(m => [m.id, m]));
  const root = memberMap.get(rootId) || members[0];

  if (!root || member.id === root.id) {
    return { relationLabel: '⭐ Root Person (Me)', relationCategory: 'me' };
  }

  // Check if spouse
  if (member.spouseId) {
    const spouse = memberMap.get(member.spouseId);
    if (spouse) {
      const spouseLabel = member.gender === 'female' ? `💍 Wife of ${spouse.name}` : `💍 Husband of ${spouse.name}`;
      if (member.spouseId === root.id) {
        return { relationLabel: spouseLabel, spouseName: spouse.name, relationCategory: 'spouse' };
      }
    }
  }

  // Check if root's spouse
  if (root.spouseId === member.id) {
    const spouseLabel = member.gender === 'female' ? `💍 Wife of ${root.name}` : `💍 Husband of ${root.name}`;
    return { relationLabel: spouseLabel, spouseName: root.name, relationCategory: 'spouse' };
  }

  // Check if sibling (brother or sister)
  const isDirectSibling = (member.siblingIds || []).includes(root.id) || 
                          (root.siblingIds || []).includes(member.id) ||
                          (member.fatherId && member.fatherId === root.fatherId && member.fatherId) ||
                          (member.motherId && member.motherId === root.motherId && member.motherId);
  if (isDirectSibling) {
    const sibLabel = member.gender === 'female' ? `👧 Sister of ${root.name}` : member.gender === 'male' ? `👦 Brother of ${root.name}` : `👫 Sibling of ${root.name}`;
    return { relationLabel: sibLabel, relationCategory: 'sibling' };
  }

  // Check if sibling of another member
  if ((member.siblingIds || []).length > 0) {
    const firstSib = memberMap.get(member.siblingIds[0]);
    if (firstSib) {
      const sibLabel = member.gender === 'female' ? `👧 Sister of ${firstSib.name}` : member.gender === 'male' ? `👦 Brother of ${firstSib.name}` : `👫 Sibling of ${firstSib.name}`;
      return { relationLabel: sibLabel, relationCategory: 'sibling' };
    }
  }

  // Check parent
  if (root.fatherId === member.id) return { relationLabel: `👨 Father of ${root.name}`, relationCategory: 'parent' };
  if (root.motherId === member.id) return { relationLabel: `👩 Mother of ${root.name}`, relationCategory: 'parent' };

  // Check child
  if ((root.childrenIds || []).includes(member.id) || member.fatherId === root.id || member.motherId === root.id) {
    const childLabel = member.gender === 'female' ? `👧 Daughter of ${root.name}` : member.gender === 'male' ? `👦 Son of ${root.name}` : `👶 Child of ${root.name}`;
    return { relationLabel: childLabel, relationCategory: 'child' };
  }

  // Fallback to explicit label or general relationship
  return {
    relationLabel: member.relationToMe || 'Relative',
    relationCategory: 'relative'
  };
};


