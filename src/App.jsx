import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';

import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import VintageTreeCanvas from './components/VintageTreeCanvas';
import TreeCanvas from './components/TreeCanvas';
import PedigreeView from './components/PedigreeView';
import TimelineView from './components/TimelineView';
import AnalyticsView from './components/AnalyticsView';
import DirectoryView from './components/DirectoryView';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import ContextMenu from './components/ContextMenu';

import { INITIAL_FAMILY_TREE, JUST_ME_TEMPLATE } from './data/initialData';
import { updateGenerations, exportToJSON, exportToGEDCOM, calculateFamilySides } from './utils/treeUtils';
import { 
  getActiveUser, 
  logoutUser, 
  getUserTree, 
  saveUserTree, 
  DEFAULT_DEMO_USER,
  updateCurrentUserTreeName,
  syncTreeToBackend,
  fetchTreeFromBackend,
  findRealUserTree,
  isAlexDemoTree
} from './utils/authUtils';

const STORAGE_KEY = 'ancestry_family_tree_v1';

export default function App() {
  // Current logged in user session
  const [currentUser, setCurrentUser] = useState(() => {
    return getActiveUser();
  });

  // Current active family tree members
  const [members, setMembers] = useState(() => {
    const active = getActiveUser();
    if (active) {
      const realTree = findRealUserTree(active, STORAGE_KEY);
      if (realTree && realTree.length > 0) {
        return realTree;
      }
      if (active.id === DEFAULT_DEMO_USER.id) {
        return updateGenerations(INITIAL_FAMILY_TREE, 'me');
      }
      // For real user (like HARO KK) on a fresh device, show their root starter node
      return updateGenerations([
        {
          ...JUST_ME_TEMPLATE[0],
          id: 'me',
          name: active.name,
          gender: active.gender || 'male',
          photo: active.photo,
          birthYear: active.birthYear || '1998',
          relationToMe: 'Me'
        }
      ], 'me');
    }
    // Check legacy storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !isAlexDemoTree(parsed)) {
          return updateGenerations(parsed, 'me');
        }
      }
    } catch (e) {
      console.error('Failed to load local tree data', e);
    }
    return updateGenerations(INITIAL_FAMILY_TREE, 'me');
  });

  const [activeView, setActiveView] = useState('vintagetree');
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState('all'); // 'all' | 'father' | 'mother'
  const [theme, setTheme] = useState('parchment');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Compute side mapping for Father's Side vs Mother's Side
  const sideMap = useMemo(() => calculateFamilySides(members, 'me'), [members]);

  // Modals state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalState, setMemberModalState] = useState({
    isOpen: false,
    initialMember: null,
    targetMember: null,
    relationType: null
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Fetch latest tree from MongoDB when user is active
  useEffect(() => {
    if (currentUser) {
      setCloudSyncStatus('syncing');
      fetchTreeFromBackend().then((remoteTree) => {
        const realLocal = findRealUserTree(currentUser, STORAGE_KEY);
        const remoteMembers = remoteTree?.members || [];
        const isRemoteReal = remoteMembers.length > 1 && !isAlexDemoTree(remoteMembers);

        // Case 1: Remote MongoDB has the real family tree (e.g. pushed from laptop)
        if (isRemoteReal) {
          setMembers(remoteMembers);
          saveUserTree(currentUser.id, remoteMembers);
          setCloudSyncStatus('synced');
          if (remoteTree.treeName && remoteTree.treeName !== currentUser.treeName) {
            setCurrentUser(prev => prev ? { ...prev, treeName: remoteTree.treeName } : prev);
          }
          return;
        }

        // Case 2: This device (e.g. laptop) has the real user-edited tree (HARO KK, etc.)
        // and MongoDB only has empty/starter (<= 1)
        if (realLocal && realLocal.length > 1) {
          console.log(`Preserving & pushing local family tree (${realLocal.length} members) to MongoDB Atlas...`);
          setMembers(realLocal);
          saveUserTree(currentUser.id, realLocal);
          syncTreeToBackend(realLocal, currentUser.treeName).then((res) => {
            if (res?.success) setCloudSyncStatus('synced');
          });
          return;
        }

        // Case 3: Remote has starter node, local has no populated tree
        if (remoteMembers.length > 0) {
          setMembers(remoteMembers);
          saveUserTree(currentUser.id, remoteMembers);
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('synced');
        }
      }).catch((e) => {
        console.warn('Backend fetch error:', e);
        setCloudSyncStatus('idle');
      });
    }
  }, [currentUser?.id]);

  // Save to LocalStorage and MongoDB whenever members or currentUser change
  useEffect(() => {
    if (currentUser) {
      saveUserTree(currentUser.id, members);
      const timer = setTimeout(() => {
        syncTreeToBackend(members, currentUser.treeName).then((res) => {
          if (res?.success) setCloudSyncStatus('synced');
        });
      }, 600);
      return () => clearTimeout(timer);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save tree data', e);
    }
  }, [members, currentUser]);

  // Handle Manual Sync to MongoDB
  const handleManualSync = async () => {
    if (!currentUser) return;
    setCloudSyncStatus('syncing');
    try {
      const res = await syncTreeToBackend(members, currentUser.treeName);
      if (res?.success) {
        setCloudSyncStatus('synced');
        alert(`✓ Cloud Sync Successful!\n\nAll ${members.length} members in "${currentUser.treeName || 'My Family Tree'}" have been safely backed up to MongoDB Atlas.\n\nNow when you log in on your phone with ${currentUser.email}, you will see your entire family tree!`);
      } else {
        setCloudSyncStatus('error');
        alert(`Cloud sync status: ${res?.error || 'Unable to sync to cloud at this moment.'}`);
      }
    } catch (err) {
      setCloudSyncStatus('error');
      alert(`Sync failed: ${err.message}`);
    }
  };

  // Handle successful login or account registration
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);

    // Check if remote tree exists in MongoDB
    const remote = await fetchTreeFromBackend();
    const realLocal = findRealUserTree(user, STORAGE_KEY);
    const remoteMembers = remote?.members || [];
    const isRemoteReal = remoteMembers.length > 1 && !isAlexDemoTree(remoteMembers);

    // Case 1: Remote MongoDB has real family tree
    if (isRemoteReal) {
      setMembers(remoteMembers);
      saveUserTree(user.id, remoteMembers);
      setCloudSyncStatus('synced');
      return;
    }

    // Case 2: Local device has the real populated tree (HARO KK, etc.)
    if (realLocal && realLocal.length > 1) {
      setMembers(realLocal);
      saveUserTree(user.id, realLocal);
      await syncTreeToBackend(realLocal, user.treeName);
      setCloudSyncStatus('synced');
      return;
    }

    // Case 3: Remote has starter node
    if (remoteMembers.length > 0) {
      setMembers(remoteMembers);
      saveUserTree(user.id, remoteMembers);
      setCloudSyncStatus('synced');
      return;
    }

    if (user.id === DEFAULT_DEMO_USER.id) {
      const demoTree = updateGenerations(INITIAL_FAMILY_TREE, 'me');
      setMembers(demoTree);
      saveUserTree(user.id, demoTree);
      syncTreeToBackend(demoTree, user.treeName);
    } else {
      const starter = [
        {
          ...JUST_ME_TEMPLATE[0],
          id: 'me',
          name: user.name,
          gender: user.gender || 'male',
          photo: user.photo,
          birthYear: user.birthYear || '1998',
          relationToMe: 'Me'
        }
      ];
      const updated = updateGenerations(starter, 'me');
      setMembers(updated);
      saveUserTree(user.id, updated);
      syncTreeToBackend(updated, user.treeName);
    }
    setCloudSyncStatus('synced');
  };

  // Handle user logout
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Handle renaming of active family tree
  const handleUpdateTreeName = async (newName) => {
    const updated = await updateCurrentUserTreeName(newName);
    if (updated) {
      setCurrentUser({ ...updated });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.1 }
      });
    }
  };

  // Handle Add or Edit Save
  const handleSaveMember = (memberData, targetMember, relationType) => {
    setMembers((prevMembers) => {
      let updated = [...prevMembers];
      const existingIdx = updated.findIndex(m => m.id === memberData.id);

      if (existingIdx >= 0) {
        // Edit existing member
        updated[existingIdx] = { ...updated[existingIdx], ...memberData };
      } else {
        // Add new member
        updated.push(memberData);

        // Link with target member if added as a relative
        if (targetMember && relationType) {
          const targetIdx = updated.findIndex(m => m.id === targetMember.id);
          if (targetIdx >= 0) {
            const targetCopy = { ...updated[targetIdx] };

            if (relationType === 'father') {
              targetCopy.fatherId = memberData.id;
              memberData.childrenIds = [...new Set([...(memberData.childrenIds || []), targetCopy.id])];
              if (targetCopy.motherId) {
                memberData.spouseId = targetCopy.motherId;
                const mIdx = updated.findIndex(m => m.id === targetCopy.motherId);
                if (mIdx >= 0) updated[mIdx] = { ...updated[mIdx], spouseId: memberData.id };
              }
            } else if (relationType === 'mother') {
              targetCopy.motherId = memberData.id;
              memberData.childrenIds = [...new Set([...(memberData.childrenIds || []), targetCopy.id])];
              if (targetCopy.fatherId) {
                memberData.spouseId = targetCopy.fatherId;
                const fIdx = updated.findIndex(m => m.id === targetCopy.fatherId);
                if (fIdx >= 0) updated[fIdx] = { ...updated[fIdx], spouseId: memberData.id };
              }
            } else if (relationType === 'spouse') {
              targetCopy.spouseId = memberData.id;
              memberData.spouseId = targetCopy.id;
            } else if (relationType === 'sibling') {
              targetCopy.siblingIds = [...new Set([...(targetCopy.siblingIds || []), memberData.id])];
              memberData.siblingIds = [...new Set([...(memberData.siblingIds || []), targetCopy.id])];
              if (targetCopy.fatherId) memberData.fatherId = targetCopy.fatherId;
              if (targetCopy.motherId) memberData.motherId = targetCopy.motherId;
            } else if (relationType === 'child') {
              targetCopy.childrenIds = [...new Set([...(targetCopy.childrenIds || []), memberData.id])];

              // Link to target parent & target parent's spouse if exists!
              if (targetCopy.gender === 'female') {
                memberData.motherId = targetCopy.id;
                if (targetCopy.spouseId) {
                  memberData.fatherId = targetCopy.spouseId;
                  const sIdx = updated.findIndex(m => m.id === targetCopy.spouseId);
                  if (sIdx >= 0) {
                    updated[sIdx] = {
                      ...updated[sIdx],
                      childrenIds: [...new Set([...(updated[sIdx].childrenIds || []), memberData.id])]
                    };
                  }
                }
              } else {
                memberData.fatherId = targetCopy.id;
                if (targetCopy.spouseId) {
                  memberData.motherId = targetCopy.spouseId;
                  const sIdx = updated.findIndex(m => m.id === targetCopy.spouseId);
                  if (sIdx >= 0) {
                    updated[sIdx] = {
                      ...updated[sIdx],
                      childrenIds: [...new Set([...(updated[sIdx].childrenIds || []), memberData.id])]
                    };
                  }
                }
              }
            }

            updated[targetIdx] = targetCopy;
          }
        }
      }

      // Sync reciprocal relationships for father, mother, spouse, children
      const finalMap = new Map(updated.map(m => [m.id, { ...m }]));
      
      finalMap.forEach((m) => {
        // If m has father, ensure father has m in childrenIds
        if (m.fatherId && finalMap.has(m.fatherId)) {
          const f = finalMap.get(m.fatherId);
          f.childrenIds = [...new Set([...(f.childrenIds || []), m.id])];
        }
        // If m has mother, ensure mother has m in childrenIds
        if (m.motherId && finalMap.has(m.motherId)) {
          const mo = finalMap.get(m.motherId);
          mo.childrenIds = [...new Set([...(mo.childrenIds || []), m.id])];
        }
        // If m has spouse, ensure spouse has m in spouseId
        if (m.spouseId && finalMap.has(m.spouseId)) {
          const sp = finalMap.get(m.spouseId);
          sp.spouseId = m.id;
        }
        // If father and mother exist, link them as spouses if not already
        if (m.fatherId && m.motherId && finalMap.has(m.fatherId) && finalMap.has(m.motherId)) {
          const f = finalMap.get(m.fatherId);
          const mo = finalMap.get(m.motherId);
          if (!f.spouseId) f.spouseId = mo.id;
          if (!mo.spouseId) mo.spouseId = f.id;
        }
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      return updateGenerations(Array.from(finalMap.values()), 'me');
    });
  };

  // Handle Delete Member
  const handleDeleteMember = (memberId) => {
    if (memberId === 'me') {
      alert('Cannot delete the root "Me" node. You can edit its details instead!');
      return;
    }

    if (window.confirm('Are you sure you want to delete this family member from the tree?')) {
      setMembers((prevMembers) => {
        const filtered = prevMembers.filter(m => m.id !== memberId);
        const cleaned = filtered.map(m => ({
          ...m,
          fatherId: m.fatherId === memberId ? null : m.fatherId,
          motherId: m.motherId === memberId ? null : m.motherId,
          spouseId: m.spouseId === memberId ? null : m.spouseId,
          childrenIds: (m.childrenIds || []).filter(id => id !== memberId),
          siblingIds: (m.siblingIds || []).filter(id => id !== memberId)
        }));
        return updateGenerations(cleaned, 'me');
      });

      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(null);
      }
    }
  };

  // Set member as new root 'me' node
  const handleSetAsMe = (memberId) => {
    setMembers((prevMembers) => {
      const updated = prevMembers.map(m => {
        if (m.id === 'me') return { ...m, id: `person_${Date.now()}` };
        if (m.id === memberId) return { ...m, id: 'me', relationToMe: 'Me (Root)' };
        return m;
      });
      return updateGenerations(updated, 'me');
    });
    setSelectedMember(null);
  };

  // Load sample demo tree
  const handleLoadDemo = () => {
    if (window.confirm('Load 4-Generation Demo Tree? This will replace your current tree.')) {
      setMembers(updateGenerations(INITIAL_FAMILY_TREE, 'me'));
    }
  };

  // Reset to single "Just Me" node
  const handleResetTree = () => {
    if (window.confirm('Start Fresh with a single "Me" template? All current members will be cleared.')) {
      const personalized = [
        {
          ...JUST_ME_TEMPLATE[0],
          id: 'me',
          name: currentUser?.name || 'Me (Root)',
          gender: currentUser?.gender || 'male',
          photo: currentUser?.photo || JUST_ME_TEMPLATE[0].photo,
          birthYear: currentUser?.birthYear || '1998',
          relationToMe: 'Me'
        }
      ];
      setMembers(updateGenerations(personalized, 'me'));
    }
  };

  // Export tree as PNG Image
  const handleExportImage = async () => {
    const exportRoot = document.getElementById('tree-export-root');
    const chartRoot = document.querySelector('.node-card')?.closest('.min-w-max');
    const fallbackCanvas = document.querySelector('.min-w-max') || document.querySelector('.tapestry-canvas');
    const canvasEl = exportRoot || chartRoot || fallbackCanvas;

    if (!canvasEl) {
      alert('Could not find tree canvas to capture image.');
      return;
    }

    let prevTransform = '';
    let isTransformAdjusted = false;

    try {
      if (exportRoot && exportRoot.style.transform) {
        prevTransform = exportRoot.style.transform;
        exportRoot.style.transform = 'none';
        isTransformAdjusted = true;
      }

      // Brief pause to allow reflow after clearing transform
      await new Promise((resolve) => setTimeout(resolve, 50));

      const dataUrl = await toPng(canvasEl, {
        backgroundColor: '#070d09',
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      const safeTreeName = (currentUser?.treeName || 'family_tree').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeTreeName}_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Could not capture tree image: ' + (err.message || 'Error creating canvas snapshot'));
    } finally {
      if (isTransformAdjusted && exportRoot) {
        exportRoot.style.transform = prevTransform;
      }
    }
  };

  // If no user is logged in, show Auth / Login / Register Page
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070d09] text-amber-100 flex flex-col font-sans selection:bg-[#740001] selection:text-amber-200 tapestry-canvas">
      
      {/* Top Header Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sideFilter={sideFilter}
        setSideFilter={setSideFilter}
        onAddMember={(target = null, relation = null) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onResetTree={handleResetTree}
        onLoadDemo={handleLoadDemo}
        onExportJSON={() => exportToJSON(members)}
        onExportGEDCOM={() => exportToGEDCOM(members)}
        onExportImage={handleExportImage}
        onImportJSON={(imported) => setMembers(updateGenerations(imported, 'me'))}
        theme={theme}
        setTheme={setTheme}
        membersCount={members.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        sideMap={sideMap}
        onUpdateTreeName={handleUpdateTreeName}
        onManualSync={handleManualSync}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Main Active View Container */}
      <main className="flex-1 relative overflow-x-hidden">
        {activeView === 'vintagetree' && (
          <VintageTreeCanvas
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onAddRelation={(target, relation) => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: target,
                relationType: relation
              });
            }}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onDeleteMember={handleDeleteMember}
            searchQuery={searchQuery}
            sideFilter={sideFilter}
            onSelectSideFilter={setSideFilter}
            sideMap={sideMap}
            onOpenContextMenu={(menu) => setContextMenu(menu)}
            onResetFilter={() => setSideFilter('all')}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {activeView === 'tree' && (
          <TreeCanvas
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onAddRelation={(target, relation) => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: target,
                relationType: relation
              });
            }}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onDeleteMember={handleDeleteMember}
            searchQuery={searchQuery}
            theme={theme}
            sideFilter={sideFilter}
            onSelectSideFilter={setSideFilter}
            sideMap={sideMap}
            onOpenContextMenu={(menu) => setContextMenu(menu)}
          />
        )}

        {activeView === 'pedigree' && (
          <PedigreeView
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            theme={theme}
          />
        )}

        {activeView === 'timeline' && (
          <TimelineView
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            members={members}
          />
        )}

        {activeView === 'directory' && (
          <DirectoryView
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onAddMember={() => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: null,
                relationType: null
              });
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </main>

      {/* Add / Edit Member Modal */}
      <MemberModal
        isOpen={memberModalState.isOpen}
        onClose={() => setMemberModalState({ ...memberModalState, isOpen: false })}
        onSave={handleSaveMember}
        initialMember={memberModalState.initialMember}
        targetMember={memberModalState.targetMember}
        relationType={memberModalState.relationType}
        members={members}
      />

      {/* Full Member Profile Modal */}
      <ProfileModal
        member={selectedMember}
        members={members}
        onClose={() => setSelectedMember(null)}
        onEdit={(m) => {
          setSelectedMember(null);
          setMemberModalState({
            isOpen: true,
            initialMember: m,
            targetMember: null,
            relationType: null
          });
        }}
        onDelete={(id) => {
          handleDeleteMember(id);
          setSelectedMember(null);
        }}
        onSelectRelative={(rel) => setSelectedMember(rel)}
        onSetAsMe={handleSetAsMe}
      />

      {/* Right Click Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddRelation={(target, relation) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onEditMember={(m) => {
          setMemberModalState({
            isOpen: true,
            initialMember: m,
            targetMember: null,
            relationType: null
          });
        }}
        onSelectMember={(m) => setSelectedMember(m)}
        onDeleteMember={handleDeleteMember}
        onSetAsMe={handleSetAsMe}
        onAddMember={(target = null, relation = null) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onCenterView={() => {
          // Trigger center view
          const meNode = members.find(m => m.id === 'me');
          if (meNode) setSelectedMember(meNode);
        }}
      />

    </div>
  );
}
