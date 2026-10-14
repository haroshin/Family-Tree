// Organic family-tree layout engine.
// "Me" sits at the top of the trunk, ancestors grow upward into the crown,
// siblings / spouses sprout sideways and descendants hang below the ground as roots.

export const SLOT = 172;      // horizontal space reserved for one person (px)
export const ROW = 225;       // vertical distance between generations (px)
const GAP = 0.12;             // extra gap between neighbouring people (in slots)
const TRUNK_H = 270;          // trunk height from "Me" down to the ground (px)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- deterministic randomness (so leaves don't jump around) ----------
export const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const generationLabel = (d) => {
  if (d === 0) return 'You';
  if (d === 1) return 'Parents';
  if (d === 2) return 'Grandparents';
  if (d === 3) return 'Great-Grandparents';
  if (d > 3) return `${d - 2}× Great-Grandparents`;
  if (d === -1) return 'Children';
  if (d === -2) return 'Grandchildren';
  return 'Descendants';
};

// ============================================================================
// 1. LAYOUT – decide where every person sits
// ============================================================================
export function computeTreeLayout(members, { showGhosts = true } = {}) {
  if (!members || members.length === 0) return null;

  const byId = new Map(members.map((m) => [m.id, m]));
  const root = byId.get('me') || members[0];

  // ---- relationship maps (built from both directions so data is forgiving) ----
  const parentsOf = new Map();
  const childrenOf = new Map();
  const spousesOf = new Map();
  const siblingsOf = new Map();
  const add = (map, a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  const valid = (id) => id && byId.has(id);

  members.forEach((m) => {
    [m.fatherId, m.motherId].forEach((p) => {
      if (valid(p) && p !== m.id) {
        add(parentsOf, m.id, p);
        add(childrenOf, p, m.id);
      }
    });
    (m.childrenIds || []).forEach((c) => {
      if (valid(c) && c !== m.id) {
        add(parentsOf, c, m.id);
        add(childrenOf, m.id, c);
      }
    });
    if (valid(m.spouseId) && m.spouseId !== m.id) {
      add(spousesOf, m.id, m.spouseId);
      add(spousesOf, m.spouseId, m.id);
    }
    (m.siblingIds || []).forEach((s) => {
      if (valid(s) && s !== m.id) {
        add(siblingsOf, m.id, s);
        add(siblingsOf, s, m.id);
      }
    });
  });
  const list = (map, id) => [...(map.get(id) || [])];

  const parentRank = (childId, pid) => {
    const p = byId.get(pid);
    if (p.gender === 'male') return 0;
    if (p.gender === 'female') return 2;
    const child = byId.get(childId);
    return child && child.fatherId === pid ? 0.5 : 1.5;
  };
  const orderedParents = (id) => list(parentsOf, id).sort((a, b) => parentRank(id, a) - parentRank(id, b));

  // ---- who knows which parents are missing (used for ghosts + hover buttons) ----
  const parentInfo = new Map();
  members.forEach((m) => {
    const ps = list(parentsOf, m.id).map((id) => byId.get(id));
    parentInfo.set(m.id, {
      count: ps.length,
      hasFather: ps.some((p) => p.gender === 'male') || ps.length >= 2,
      hasMother: ps.some((p) => p.gender === 'female') || ps.length >= 2,
    });
  });

  // ---- BFS from "Me": every person grows out of the closest relative ----
  const anchor = new Map([[root.id, null]]);
  const kind = new Map([[root.id, 'root']]);
  const order = [root.id];
  const queue = [root.id];
  while (queue.length) {
    const id = queue.shift();
    const visit = (nid, k) => {
      if (nid === id || anchor.has(nid)) return;
      anchor.set(nid, id);
      kind.set(nid, k);
      order.push(nid);
      queue.push(nid);
    };
    const parents = orderedParents(id);
    parents.forEach((p) => visit(p, 'parent'));
    parents.forEach((p) => list(childrenOf, p).forEach((c) => visit(c, 'sibling')));
    list(siblingsOf, id).forEach((s) => visit(s, 'sibling'));
    list(spousesOf, id).forEach((s) => visit(s, 'spouse'));
    list(childrenOf, id).forEach((c) => visit(c, 'child'));
  }
  // People with no links at all still grow from "Me"
  members.forEach((m) => {
    if (!anchor.has(m.id)) {
      anchor.set(m.id, root.id);
      kind.set(m.id, 'loose');
      order.push(m.id);
    }
  });

  // ---- "ghost" buds = empty branches where a parent can still be added ----
  const ghosts = new Map();
  const genOf = (id) => {
    if (ghosts.has(id)) return ghosts.get(id).generation;
    const g = Number(byId.get(id)?.generation);
    return Number.isFinite(g) ? g : 0;
  };

  if (showGhosts) {
    const pedigree = new Set([root.id]);
    order.forEach((id) => {
      if (kind.get(id) === 'parent' && pedigree.has(anchor.get(id))) pedigree.add(id);
    });
    pedigree.forEach((id) => {
      const info = parentInfo.get(id);
      let slots = 2 - info.count;
      const addGhost = (type) => {
        if (slots <= 0) return;
        slots--;
        const gid = `ghost:${type}:${id}`;
        ghosts.set(gid, { ghostType: type, targetId: id, generation: genOf(id) + 1 });
        anchor.set(gid, id);
        kind.set(gid, 'parent');
        order.push(gid);
      };
      if (!info.hasFather) addGhost('father');
      if (!info.hasMother) addGhost('mother');
    });
  }

  // ---- visual tree (each person -> people that sprout from them) ----
  const kids = new Map();
  order.forEach((id) => {
    const a = anchor.get(id);
    if (a == null) return;
    if (!kids.has(a)) kids.set(a, []);
    kids.get(a).push(id);
  });
  const kidsOf = (id) => kids.get(id) || [];
  const typeOf = (child, parent) => {
    const d = genOf(child) - genOf(parent);
    return d > 0 ? 'up' : d < 0 ? 'down' : 'lateral';
  };

  const upRank = (id, anchorId) => {
    if (ghosts.has(id)) return ghosts.get(id).ghostType === 'father' ? 0 : 2;
    if (kind.get(id) !== 'parent') return 1;
    return parentRank(anchorId, id);
  };

  // ---- sides: father's line grows left, mother's line grows right ----
  const side = new Map([[root.id, 'center']]);
  order.forEach((id) => {
    const a = anchor.get(id);
    if (a == null) return;
    if (a === root.id) {
      const t = typeOf(id, a);
      if (t === 'up') side.set(id, upRank(id, a) <= 1 ? 'left' : 'right');
      else if (t === 'lateral') side.set(id, kind.get(id) === 'sibling' ? 'left' : 'right');
      else side.set(id, 'center');
    } else {
      side.set(id, side.get(a) || 'center');
    }
  });

  // ---- contour-packing layout (compact, never overlaps within a generation row) ----
  const HW = (id) => (ghosts.has(id) ? 0.3 : 0.5);
  const sepRight = (C, K) => {
    let dx = -Infinity;
    K.forEach((k, g) => {
      const c = C.get(g);
      if (c) dx = Math.max(dx, c.max + GAP - k.min);
    });
    return dx;
  };
  const sepLeft = (C, K) => {
    let dx = Infinity;
    K.forEach((k, g) => {
      const c = C.get(g);
      if (c) dx = Math.min(dx, c.min - GAP - k.max);
    });
    return dx;
  };
  const mergeInto = (T, S, dx) => {
    S.rel.forEach((x, k) => T.rel.set(k, x + dx));
    S.contour.forEach((c, g) => {
      const t = T.contour.get(g);
      if (t) {
        t.min = Math.min(t.min, c.min + dx);
        t.max = Math.max(t.max, c.max + dx);
      } else {
        T.contour.set(g, { min: c.min + dx, max: c.max + dx });
      }
    });
  };

  const layoutNode = (id) => {
    const T = {
      rel: new Map([[id, 0]]),
      contour: new Map([[genOf(id), { min: -HW(id), max: HW(id) }]]),
    };
    const ks = kidsOf(id);
    const ups = ks.filter((c) => typeOf(c, id) === 'up').sort((a, b) => upRank(a, id) - upRank(b, id));
    const downs = ks
      .filter((c) => typeOf(c, id) === 'down')
      .sort((a, b) => (parseInt(byId.get(a)?.birthYear) || 0) - (parseInt(byId.get(b)?.birthYear) || 0));
    const lats = ks.filter((c) => typeOf(c, id) === 'lateral');

    const packCentered = (group) => {
      if (!group.length) return;
      const G = { rel: new Map(), contour: new Map() };
      const xs = [];
      group.forEach((c, i) => {
        const S = layoutNode(c);
        let dx = 0;
        if (i > 0) {
          dx = sepRight(G.contour, S.contour);
          const minDx = xs[i - 1] + HW(group[i - 1]) + HW(c) + GAP;
          dx = Number.isFinite(dx) ? Math.max(dx, minDx) : minDx;
        }
        xs.push(dx);
        mergeInto(G, S, dx);
      });
      mergeInto(T, G, -(xs[0] + xs[xs.length - 1]) / 2);
    };

    packCentered(ups);
    packCentered(downs);

    const s = side.get(id);
    const L = [];
    const R = [];
    lats.forEach((c) => {
      const isSib = kind.get(c) === 'sibling';
      const goLeft = s === 'right' ? !isSib : isSib; // siblings grow outward, spouses inward
      (goLeft ? L : R).push(c);
    });
    R.forEach((c) => {
      const S = layoutNode(c);
      const dx = sepRight(T.contour, S.contour);
      mergeInto(T, S, Number.isFinite(dx) ? dx : 1);
    });
    L.forEach((c) => {
      const S = layoutNode(c);
      const dx = sepLeft(T.contour, S.contour);
      mergeInto(T, S, Number.isFinite(dx) ? dx : -1);
    });
    return T;
  };

  const T = layoutNode(root.id);

  // ---- branch thickness = how much tree grows beyond this person ----
  const weight = new Map();
  const calcWeight = (id) => {
    let w = ghosts.has(id) ? 0.35 : 1;
    kidsOf(id).forEach((c) => {
      const wc = calcWeight(c);
      if (typeOf(c, id) !== 'down') w += wc;
    });
    weight.set(id, w);
    return w;
  };
  calcWeight(root.id);

  // ---- absolute coordinates ----
  const rootGen = genOf(root.id);
  const yOf = (g) => {
    const d = g - rootGen;
    return d >= 0 ? -d * ROW : TRUNK_H + 150 + (-d - 1) * ROW * 0.85;
  };

  const raw = [];
  T.rel.forEach((rx, id) => {
    const g = genOf(id);
    const ghost = ghosts.get(id);
    raw.push({
      id,
      x: rx * SLOT,
      y: yOf(g),
      gen: g,
      ghost: !!ghost,
      ghostType: ghost?.ghostType,
      targetId: ghost?.targetId,
      member: byId.get(id) || null,
      isRoot: id === root.id,
      side: side.get(id),
      kind: kind.get(id),
      anchorId: anchor.get(id),
      hasRealUp: kidsOf(id).some((c) => !ghosts.has(c) && typeOf(c, id) === 'up'),
    });
  });

  const PAD_X = 190;
  const LABEL = 150;
  const PAD_TOP = 210;
  const PAD_BOTTOM = 130;
  const xs = raw.map((n) => n.x);
  const ys = raw.map((n) => n.y);
  const minX = Math.min(...xs, -260) - PAD_X - LABEL;
  const maxX = Math.max(...xs, 260) + PAD_X;
  const minY = Math.min(...ys) - PAD_TOP;
  const maxY = Math.max(...ys, TRUNK_H + 40) + PAD_BOTTOM;
  const ox = -minX;
  const oy = -minY;

  const nodes = raw.map((n) => ({ ...n, x: n.x + ox, y: n.y + oy }));
  const links = order
    .filter((id) => anchor.get(id) != null)
    .map((id) => ({ from: anchor.get(id), to: id, type: typeOf(id, anchor.get(id)), weight: weight.get(id) }));

  const rowGens = [...new Set(raw.map((n) => n.gen))].sort((a, b) => b - a);
  const rows = rowGens.map((g) => ({ gen: g, d: g - rootGen, y: yOf(g) + oy, label: generationLabel(g - rootGen) }));

  return {
    nodes,
    links,
    rows,
    parentInfo,
    rootId: root.id,
    rootGen,
    rootWeight: weight.get(root.id),
    groundY: TRUNK_H + oy,
    W: maxX - minX,
    H: maxY - minY,
  };
}

// ============================================================================
// 2. ARTWORK – trunk, tapered branches, twigs and leaves
// ============================================================================
const bez = (t, a, b, c, d) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const dbez = (t, a, b, c, d) => {
  const u = 1 - t;
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
};
const curvePt = (cv, t) => ({
  x: bez(t, cv.p0.x, cv.c1.x, cv.c2.x, cv.p1.x),
  y: bez(t, cv.p0.y, cv.c1.y, cv.c2.y, cv.p1.y),
});
const curveAng = (cv, t) =>
  Math.atan2(dbez(t, cv.p0.y, cv.c1.y, cv.c2.y, cv.p1.y), dbez(t, cv.p0.x, cv.c1.x, cv.c2.x, cv.p1.x));
const f = (v) => v.toFixed(1);
const curveD = (cv, dx = 0) =>
  `M${f(cv.p0.x + dx)},${f(cv.p0.y)} C${f(cv.c1.x + dx)},${f(cv.c1.y)} ${f(cv.c2.x + dx)},${f(cv.c2.y)} ${f(cv.p1.x + dx)},${f(cv.p1.y)}`;

const taperedPath = (cv, w0, w1, steps = 24) => {
  const L = [];
  const R = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curvePt(cv, t);
    const a = curveAng(cv, t);
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    const w = (w0 + (w1 - w0) * Math.pow(t, 0.75)) / 2;
    L.push(`${f(p.x + nx * w)},${f(p.y + ny * w)}`);
    R.push(`${f(p.x - nx * w)},${f(p.y - ny * w)}`);
  }
  return `M${L.join(' L')} L${R.reverse().join(' L')} Z`;
};

const LEAF_COLORS = ['#4b6a1e', '#5d7d2b', '#3d5818', '#6e8f36', '#33501a', '#57762a'];
const DRY_COLORS = ['#8a6d2b', '#7a5a22', '#9c7a33', '#6b5a22'];

const makeSprig = (r, out, x, y, ang, len, scale, count, tStart = 0.25) => {
  const bend = (r() - 0.5) * 0.7;
  const mx = x + Math.cos(ang + bend) * len * 0.5;
  const my = y + Math.sin(ang + bend) * len * 0.5;
  const ex = x + Math.cos(ang) * len;
  const ey = y + Math.sin(ang) * len;
  out.twigs.push({ d: `M${f(x)},${f(y)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}`, w: Math.max(1, 1.7 * scale) });
  for (let i = 0; i < count; i++) {
    const t = tStart + (1 - tStart) * ((i + 0.5) / (count + 0.4));
    const u = 1 - t;
    const px = u * u * x + 2 * u * t * mx + t * t * ex;
    const py = u * u * y + 2 * u * t * my + t * t * ey;
    const ta = Math.atan2(2 * u * (my - y) + 2 * t * (ey - my), 2 * u * (mx - x) + 2 * t * (ex - mx));
    const sideSign = i % 2 === 0 ? 1 : -1;
    out.leaves.push({
      x: px,
      y: py,
      rot: ((ta + sideSign * (0.75 + r() * 0.35)) * 180) / Math.PI,
      s: (0.8 + r() * 0.45) * scale,
      c: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
    });
  }
  out.leaves.push({
    x: ex,
    y: ey,
    rot: ((ang + (r() - 0.5) * 0.3) * 180) / Math.PI,
    s: (1 + r() * 0.3) * scale,
    c: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
  });
};

export function buildTreeArt(L) {
  const byId = new Map(L.nodes.map((n) => [n.id, n]));
  const root = byId.get(L.rootId);
  const out = { twigs: [], leaves: [] };
  const branches = [];
  const roots = [];

  // ---------------- trunk ----------------
  const topW = clamp(16 + 5.5 * Math.sqrt(L.rootWeight), 22, 64);
  const botW = topW * 1.55 + 18;
  const gx = root.x;
  const gy = L.groundY;
  const trunkCurve = {
    p0: { x: gx, y: gy },
    c1: { x: gx - 14, y: gy - (gy - root.y) * 0.35 },
    c2: { x: gx + 12, y: root.y + (gy - root.y) * 0.35 },
    p1: { x: root.x, y: root.y },
  };
  const trunkD = taperedPath(trunkCurve, botW, topW * 0.85, 30);

  const bark = [-0.62, -0.3, 0.02, 0.32, 0.6].map((k, idx) => {
    const pts = [];
    for (let t = 0.02; t <= 0.9; t += 0.04) {
      const p = curvePt(trunkCurve, t);
      const a = curveAng(trunkCurve, t);
      const w = (botW + (topW * 0.85 - botW) * Math.pow(t, 0.75)) / 2;
      const off = w * k + Math.sin(t * 13 + idx * 1.7) * 1.6;
      pts.push(`${f(p.x - Math.sin(a) * off)},${f(p.y + Math.cos(a) * off)}`);
    }
    return `M${pts.join(' L')}`;
  });

  const flares = [
    { dir: -1, len: 100, dy: 14 },
    { dir: -0.55, len: 62, dy: 26 },
    { dir: 0.5, len: 64, dy: 24 },
    { dir: 1, len: 105, dy: 12 },
  ].map(({ dir, len, dy }) => {
    const p0 = { x: gx + dir * botW * 0.22, y: gy - 14 };
    const p1 = { x: gx + dir * (len + botW * 0.3), y: gy + dy };
    return taperedPath(
      { p0, c1: { x: p0.x + dir * len * 0.3, y: gy + 2 }, c2: { x: p1.x - dir * len * 0.35, y: p1.y - 4 }, p1 },
      botW * 0.38,
      2.5,
      16
    );
  });

  // ---------------- branches ----------------
  const curveOf = new Map();
  const attach = (aId) => {
    if (aId === L.rootId) {
      const h = trunkCurve.p0.y - trunkCurve.p1.y;
      return curvePt(trunkCurve, 1 - Math.min(0.45, 78 / h));
    }
    const cv = curveOf.get(aId);
    if (cv && cv.kind !== 'down') return curvePt(cv, 0.8);
    const a = byId.get(aId);
    return { x: a.x, y: a.y + 30 };
  };

  L.links.forEach((lk) => {
    const a = byId.get(lk.from);
    const n = byId.get(lk.to);
    if (!a || !n) return;
    const r = rng(hashStr('branch:' + lk.to));

    if (lk.type === 'up') {
      const dx = n.x - a.x;
      const dy = a.y - n.y;
      const cv = {
        kind: 'up',
        p0: { x: a.x + clamp(dx * 0.06, -10, 10), y: a.y - 4 },
        c1: { x: a.x + dx * 0.1, y: a.y - dy * 0.5 },
        c2: { x: a.x + dx * 0.78, y: n.y + dy * 0.32 },
        p1: { x: n.x, y: n.y },
      };
      curveOf.set(n.id, cv);
      const maxW = a.id === L.rootId ? topW * 0.8 : 40;
      const w0 = clamp(5 + 4.4 * Math.sqrt(lk.weight), 5, maxW);
      const w1 = Math.max(3, w0 * 0.38);
      branches.push({ d: taperedPath(cv, w0, w1), hl: curveD(cv, -1.5), hw: Math.max(1, w1 * 0.45), w: w0, ghost: n.ghost });

      if (!n.ghost) {
        [0.38, 0.62, 0.84].forEach((t, i) => {
          if (r() < 0.25) return;
          const p = curvePt(cv, t);
          const ta = curveAng(cv, t);
          const sideSign = (i % 2 ? 1 : -1) * (r() < 0.5 ? 1 : -1);
          let ang = ta + sideSign * (0.55 + r() * 0.5);
          if (Math.sin(ang) > 0.25) ang = ta - sideSign * (0.55 + r() * 0.5);
          makeSprig(r, out, p.x, p.y, ang, 24 + r() * 26, 0.85, 2 + Math.floor(r() * 3));
        });
      }
    } else if (lk.type === 'lateral') {
      const p0 = attach(a.id);
      const dx = n.x - p0.x;
      const cv = {
        kind: 'lateral',
        p0,
        c1: { x: p0.x + dx * 0.42, y: p0.y + 6 },
        c2: { x: n.x - dx * 0.12, y: n.y + 46 },
        p1: { x: n.x, y: n.y },
      };
      curveOf.set(n.id, cv);
      const w0 = clamp(5 + 3 * Math.sqrt(lk.weight), 5, 22);
      branches.push({ d: taperedPath(cv, w0, 3.2), hl: curveD(cv, -1.2), hw: 1.4, w: w0 });
      const p = curvePt(cv, 0.5);
      makeSprig(r, out, p.x, p.y, -Math.PI / 2 + (dx > 0 ? -0.5 : 0.5), 28 + r() * 16, 0.85, 3);
    } else {
      const start = a.id === L.rootId ? { x: a.x, y: L.groundY + 4 } : { x: a.x, y: a.y + 40 };
      const dx = n.x - start.x;
      const dy = n.y - start.y;
      const cv = {
        kind: 'down',
        p0: start,
        c1: { x: start.x + dx * 0.2, y: start.y + dy * 0.35 },
        c2: { x: n.x - dx * 0.05, y: n.y - dy * 0.5 },
        p1: { x: n.x, y: n.y },
      };
      curveOf.set(n.id, cv);
      roots.push({ d: taperedPath(cv, 12, 3.5), hl: curveD(cv, -1) });
    }
  });

  // ---------------- crowns of leaves around people ----------------
  L.nodes.forEach((n) => {
    const r = rng(hashStr('tip:' + n.id));
    if (n.ghost) {
      makeSprig(r, out, n.x, n.y, -Math.PI / 2 + (r() - 0.5) * 1.2, 44, 0.75, 2, 0.4);
      return;
    }
    if (n.gen < L.rootGen) return; // descendants live below ground
    if (!n.hasRealUp) {
      [-2.5, -1.95, -1.2, -0.65].forEach((b) => {
        if (r() < 0.15) return;
        makeSprig(r, out, n.x, n.y, b + (r() - 0.5) * 0.3, 100 + r() * 36, 1.05, 3 + Math.floor(r() * 3), 0.55);
      });
    } else {
      [-2.7, -0.45].forEach((b) => {
        if (r() < 0.35) return;
        makeSprig(r, out, n.x, n.y, b + (r() - 0.5) * 0.3, 92 + r() * 20, 0.95, 2 + Math.floor(r() * 2), 0.6);
      });
    }
  });

  // ---------------- ground ----------------
  const gr = rng(hashStr('ground'));
  const grass = [];
  for (let i = -16; i <= 16; i++) {
    const x = gx + i * 13 + (gr() - 0.5) * 6;
    const y = gy + 14 + (gr() - 0.5) * 6;
    const h = 6 + gr() * 9;
    grass.push(`M${f(x)},${f(y)} q${f((gr() - 0.5) * 6)},${f(-h * 0.6)} ${f((gr() - 0.5) * 8)},${f(-h)}`);
  }
  const fallen = [];
  for (let i = 0; i < 9; i++) {
    fallen.push({
      x: gx + (gr() - 0.5) * botW * 6,
      y: gy + 12 + gr() * 18,
      rot: gr() * 360,
      s: 0.8 + gr() * 0.4,
      c: DRY_COLORS[Math.floor(gr() * DRY_COLORS.length)],
    });
  }

  return {
    trunk: { d: trunkD, bark, flares, x0: gx - botW / 2, x1: gx + botW / 2 },
    branches: branches.sort((a, b) => b.w - a.w),
    roots,
    twigs: out.twigs,
    leaves: out.leaves,
    ground: { x: gx, y: gy, w: botW, grass, fallen },
  };
}
