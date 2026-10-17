import React, { useState, useRef, useMemo, useLayoutEffect, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Target,
  Maximize,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Heart,
  Users,
  Baby,
  Sprout,
  MapPin,
  Briefcase,
  Crown,
  GitBranch,
} from 'lucide-react';

import Avatar from './Avatar';
import { computeTreeLayout, buildTreeArt } from '../utils/treeLayout';
import { resolveDetailedRelationship } from '../utils/treeUtils';

const LEAF_PATH = 'M50 2 C 78 22, 98 52, 92 78 C 86 100, 64 112, 50 114 C 36 112, 14 100, 8 78 C 2 52, 22 22, 50 2 Z';
const LEAF_VEINS =
  'M50 30 Q38 26 26 31 M50 30 Q62 26 74 31 M50 48 Q34 44 16 54 M50 48 Q66 44 84 54 M50 96 Q36 100 22 95 M50 96 Q64 100 78 95';
const SMALL_LEAF = 'M0 0 C4 -4.8 10 -4.4 14 0 C10 4.4 4 4.8 0 0 Z';

const clampZoom = (z) => Math.min(2, Math.max(0.25, z));

export default function VintageTreeCanvas({
  members,
  onSelectMember,
  onAddRelation,
  onEditMember,
  onDeleteMember,
  searchQuery,
  sideFilter = 'all',
  sideMap,
  onOpenContextMenu,
  onResetFilter,
  onLoadDemo
}) {
  const [showGhosts, setShowGhosts] = useState(true);
  const [showConnectors, setShowConnectors] = useState(false);
  const [zoom, setZoom] = useState(0.8);
  const [hoveredId, setHoveredId] = useState(null);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const zoomRef = useRef(zoom);
  const zoomAnchor = useRef(null);
  const pendingCenter = useRef(null);
  const didInit = useRef(false);
  const drag = useRef(null);
  const hoverTimer = useRef(null);
  zoomRef.current = zoom;

  const layout = useMemo(() => computeTreeLayout(members, { showGhosts }), [members, showGhosts]);
  const art = useMemo(() => (layout ? buildTreeArt(layout) : null), [layout]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const rootNode = layout?.nodes.find((n) => n.isRoot);

  const spousePairs = useMemo(() => {
    if (!layout) return [];
    const pairs = [];
    const seen = new Set();
    const nodeMap = new Map(layout.nodes.filter(n => !n.ghost).map(n => [n.member.id, n]));

    layout.nodes.forEach(n => {
      if (n.ghost || !n.member) return;
      const m = n.member;
      if (m.spouseId && nodeMap.has(m.spouseId)) {
        const key = [m.id, m.spouseId].sort().join('_');
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({
            id: key,
            node1: n,
            node2: nodeMap.get(m.spouseId),
            m1: m,
            m2: byId.get(m.spouseId)
          });
        }
      }
    });
    return pairs;
  }, [layout, byId]);

  const siblingPairs = useMemo(() => {
    if (!layout) return [];
    const pairs = [];
    const seen = new Set();
    const nodeMap = new Map(layout.nodes.filter(n => !n.ghost).map(n => [n.member.id, n]));

    layout.nodes.forEach(n => {
      if (n.ghost || !n.member) return;
      const m = n.member;
      (m.siblingIds || []).forEach(sId => {
        if (nodeMap.has(sId)) {
          const key = [m.id, sId].sort().join('_');
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({
              id: key,
              node1: n,
              node2: nodeMap.get(sId),
              m1: m,
              m2: byId.get(sId)
            });
          }
        }
      });
    });
    return pairs;
  }, [layout, byId]);

  // ---------------- view helpers ----------------
  const centerOn = useCallback((x, y, fy = 0.5) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    const vr = vp.getBoundingClientRect();
    const cr = ct.getBoundingClientRect();
    vp.scrollLeft += cr.left + x * zoomRef.current - (vr.left + vr.width / 2);
    vp.scrollTop += cr.top + y * zoomRef.current - (vr.top + vr.height * fy);
  }, []);

  const zoomTo = useCallback((target, clientX, clientY) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    const prev = zoomRef.current;
    const z = clampZoom(target);
    if (!vp || !ct || Math.abs(z - prev) < 0.001) return;
    const vr = vp.getBoundingClientRect();
    const cr = ct.getBoundingClientRect();
    const cx = clientX ?? vr.left + vr.width / 2;
    const cy = clientY ?? vr.top + vr.height / 2;
    zoomAnchor.current = { px: (cx - cr.left) / prev, py: (cy - cr.top) / prev, cx, cy };
    setZoom(z);
  }, []);

  const zoomAndCenter = useCallback(
    (z, target) => {
      const nz = clampZoom(z);
      if (Math.abs(nz - zoomRef.current) < 0.001) {
        centerOn(target.x, target.y, target.fy);
      } else {
        pendingCenter.current = target;
        setZoom(nz);
      }
    },
    [centerOn]
  );

  const fitZoom = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !layout) return 1;
    return Math.min(vp.clientWidth / layout.W, vp.clientHeight / layout.H) * 0.96;
  }, [layout]);

  // Keep the point under the cursor fixed while zooming
  useLayoutEffect(() => {
    const a = zoomAnchor.current;
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (a && vp && ct) {
      const cr = ct.getBoundingClientRect();
      vp.scrollLeft += cr.left + a.px * zoom - a.cx;
      vp.scrollTop += cr.top + a.py * zoom - a.cy;
      zoomAnchor.current = null;
    }
    if (pendingCenter.current) {
      const t = pendingCenter.current;
      pendingCenter.current = null;
      centerOn(t.x, t.y, t.fy);
    }
  }, [zoom, centerOn]);

  // First load: choose a comfortable zoom and focus on "Me"
  useLayoutEffect(() => {
    if (!layout || !rootNode || didInit.current) return;
    didInit.current = true;
    const z = Math.min(1, Math.max(0.45, fitZoom()));
    zoomAndCenter(z, { x: rootNode.x, y: rootNode.y, fy: 0.62 });
  }, [layout, rootNode, fitZoom, zoomAndCenter]);

  // When sideFilter changes, smoothly focus and center on the corresponding lineage branch
  useEffect(() => {
    if (!layout || !didInit.current) return;
    if (sideFilter === 'mother') {
      const maternalNodes = layout.nodes.filter(n => !n.ghost && sideMap?.get(n.member?.id) === 'mother');
      if (maternalNodes.length > 0) {
        const avgX = maternalNodes.reduce((sum, n) => sum + n.x, 0) / maternalNodes.length;
        const avgY = maternalNodes.reduce((sum, n) => sum + n.y, 0) / maternalNodes.length;
        centerOn(avgX, avgY, 0.45);
      }
    } else if (sideFilter === 'father') {
      const paternalNodes = layout.nodes.filter(n => !n.ghost && sideMap?.get(n.member?.id) === 'father');
      if (paternalNodes.length > 0) {
        const avgX = paternalNodes.reduce((sum, n) => sum + n.x, 0) / paternalNodes.length;
        const avgY = paternalNodes.reduce((sum, n) => sum + n.y, 0) / paternalNodes.length;
        centerOn(avgX, avgY, 0.45);
      }
    } else if (rootNode) {
      centerOn(rootNode.x, rootNode.y, 0.62);
    }
  }, [sideFilter, layout, sideMap, centerOn, rootNode]);

  // Ctrl / ⌘ + mouse wheel (or trackpad pinch) zoom
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomTo(zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX, e.clientY);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoomTo]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Drag-to-pan (moves the scrollbars)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('[data-node],[data-ui]')) return;
    const vp = viewportRef.current;
    drag.current = { x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop };
    setDragging(true);
    setHoveredId(null);
    const move = (ev) => {
      const d = drag.current;
      if (!d) return;
      vp.scrollLeft = d.sl - (ev.clientX - d.x);
      vp.scrollTop = d.st - (ev.clientY - d.y);
    };
    const up = () => {
      drag.current = null;
      setDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleEnter = (id) => {
    if (drag.current) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoveredId(id), 90);
  };
  const handleLeave = (id) => {
    clearTimeout(hoverTimer.current);
    setHoveredId((h) => (h === id ? null : h));
  };

  const isMatch = (m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.maidenName?.toLowerCase().includes(q) ||
      m.relationToMe?.toLowerCase().includes(q) ||
      m.birthPlace?.toLowerCase().includes(q)
    );
  };

  const addRelation = (member, type) => {
    setHoveredId(null);
    onAddRelation(member, type);
  };

  if (!layout || !art) return null;
  const { W, H } = layout;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden tapestry-canvas select-none">
      {/* Ancient tapestry burnt vignette edges */}
      <div className="absolute inset-0 tapestry-burnt-edges pointer-events-none" />

      {/* ================= scrollable / zoomable sheet ================= */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          if (onOpenContextMenu) {
            e.preventDefault();
            onOpenContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas', member: null });
          }
        }}
        className={`absolute inset-0 overflow-auto ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          style={{
            width: 'max-content',
            minWidth: '100%',
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: W * zoom, height: H * zoom, position: 'relative', flexShrink: 0 }}>
            <div
              ref={contentRef}
              id="tree-export-root"
              style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: '0 0' }}
            >
              {/* ---------------- wizarding tapestry artwork ---------------- */}
              <svg width={W} height={H} className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <defs>
                  <filter id="inkRough" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="9" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="rough" />
                    <feDropShadow in="rough" dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                  {/* Golden Embroidered Tree Trunk */}
                  <linearGradient id="trunkGrad" gradientUnits="userSpaceOnUse" x1={art.trunk.x0} y1="0" x2={art.trunk.x1} y2="0">
                    <stop offset="0%" stopColor="#08140c" />
                    <stop offset="30%" stopColor="#1f3827" />
                    <stop offset="50%" stopColor="#75561a" />
                    <stop offset="70%" stopColor="#2e4d36" />
                    <stop offset="100%" stopColor="#08140c" />
                  </linearGradient>
                  {/* Tapestry Branch with Gold Thread Shimmer */}
                  <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0d1f14" />
                    <stop offset="45%" stopColor="#8a671d" />
                    <stop offset="55%" stopColor="#c59f3d" />
                    <stop offset="100%" stopColor="#0d1f14" />
                  </linearGradient>
                  {/* Slytherin Emerald Velvet Leaf */}
                  <linearGradient id="nodeLeaf" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2d6a4f" />
                    <stop offset="50%" stopColor="#1b4332" />
                    <stop offset="100%" stopColor="#081c15" />
                  </linearGradient>
                  {/* Hogwarts Pure Gold Leaf for Heirs (Me) */}
                  <linearGradient id="nodeLeafMe" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="35%" stopColor="#d4af37" />
                    <stop offset="70%" stopColor="#a16207" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>
                  {/* Gryffindor Crimson Velvet Leaf */}
                  <linearGradient id="nodeLeafGryffindor" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b91c1c" />
                    <stop offset="50%" stopColor="#7f1d1d" />
                    <stop offset="100%" stopColor="#450a0a" />
                  </linearGradient>
                </defs>

                {/* Generation labels in the margin */}
                {layout.rows.map((row) => (
                  <g key={row.gen} opacity="0.8">
                    <text x="36" y={row.y - 6} fontFamily="'Cinzel Decorative', 'Cinzel', serif" fontSize="12" fontWeight="700" fill="#d4af37" letterSpacing="3">
                      {row.d === 0 ? '✦ ROOT (ME)' : `✦ GENERATION ${Math.abs(row.d)}`}
                    </text>
                    <text x="36" y={row.y + 12} fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="13" fill="#e5c158">
                      {row.label}
                    </text>
                    <line x1="36" y1={row.y + 20} x2="160" y2={row.y + 20} stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                  </g>
                ))}

                {/* enchanted moss & tapestry ground */}
                <ellipse cx={art.ground.x} cy={art.ground.y + 18} rx={art.ground.w * 3.2} ry="18" fill="rgba(6,15,9,0.5)" />
                <path
                  d={`M${art.ground.x - 300},${art.ground.y + 20} Q${art.ground.x},${art.ground.y - 2} ${art.ground.x + 300},${art.ground.y + 20}`}
                  stroke="#8a671d"
                  strokeOpacity="0.6"
                  strokeWidth="2.5"
                  fill="none"
                />

                {/* roots to descendants, trunk and branches */}
                <g filter="url(#inkRough)">
                  {art.roots.map((r, i) => (
                    <path key={`root-${i}`} d={r.d} fill="#3d2410" opacity="0.9" />
                  ))}
                  {art.trunk.flares.map((d, i) => (
                    <path key={`flare-${i}`} d={d} fill="#2a180b" />
                  ))}
                  <path d={art.trunk.d} fill="url(#trunkGrad)" />
                  {art.branches.map((b, i) => (
                    <path key={`br-${i}`} d={b.d} fill="url(#branchGrad)" opacity={b.ghost ? 0.45 : 1} />
                  ))}
                </g>

                {/* bark texture + highlights */}
                <g fill="none" strokeLinecap="round">
                  {art.trunk.bark.map((d, i) => (
                    <path key={`bark-${i}`} d={d} stroke="#120a04" strokeOpacity="0.55" strokeWidth="1.3" />
                  ))}
                  {art.branches.map((b, i) => (
                    <path key={`hl-${i}`} d={b.hl} stroke="#a0703f" strokeOpacity={b.ghost ? 0.12 : 0.3} strokeWidth={b.hw} />
                  ))}
                  {art.ground.grass.map((d, i) => (
                    <path key={`grass-${i}`} d={d} stroke="#4a5a22" strokeOpacity="0.7" strokeWidth="1.3" />
                  ))}
                </g>

                {/* twigs */}
                <g fill="none" stroke="#2f1c0d" strokeLinecap="round">
                  {art.twigs.map((t, i) => (
                    <path key={`twig-${i}`} d={t.d} strokeWidth={t.w} />
                  ))}
                </g>

                {/* leaves */}
                <g>
                  {[...art.leaves, ...art.ground.fallen].map((l, i) => (
                    <g key={`leaf-${i}`} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)}) scale(${(l.s * 1.15).toFixed(2)})`}>
                      <path d={SMALL_LEAF} fill={l.c} stroke="#1d2a0c" strokeWidth="0.6" />
                      <path d="M1 0 L12 0" stroke="#1d2a0c" strokeOpacity="0.5" strokeWidth="0.5" />
                    </g>
                  ))}
                </g>

                {/* Connection lines rendering (Active when showConnectors toggle is ON or when hovering a node) */}
                {(showConnectors || hoveredId) && (
                  <g>
                    {/* Spouse Marriage Connectors */}
                    {spousePairs.map(({ id, node1, node2 }) => {
                      const isRelevant = !hoveredId || node1.id === hoveredId || node2.id === hoveredId;
                      if (!showConnectors && !isRelevant) return null;
                      const mx = (node1.x + node2.x) / 2;
                      const my = (node1.y + node2.y) / 2;
                      return (
                        <g key={`spouse-link-${id}`} opacity={isRelevant ? 1 : 0.25}>
                          <line
                            x1={node1.x}
                            y1={node1.y}
                            x2={node2.x}
                            y2={node2.y}
                            stroke="#f59e0b"
                            strokeWidth={isRelevant ? "3" : "1.5"}
                            strokeDasharray="4 2"
                          />
                          <rect
                            x={mx - 32}
                            y={my - 10}
                            width="64"
                            height="20"
                            rx="10"
                            fill="#2b1c0d"
                            stroke="#d97706"
                            strokeWidth="1.5"
                          />
                          <text
                            x={mx}
                            y={my + 3}
                            fill="#fbbf24"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="sans-serif"
                          >
                            💍 Spouse
                          </text>
                        </g>
                      );
                    })}

                    {/* Dual-Parent Joint Connectors for Children */}
                    {layout.nodes.map((n) => {
                      if (n.ghost || !n.member) return null;
                      const m = n.member;
                      if (!m.fatherId || !m.motherId) return null;
                      const fNode = layout.nodes.find((fn) => fn.member?.id === m.fatherId);
                      const mNode = layout.nodes.find((mn) => mn.member?.id === m.motherId);
                      if (!fNode || !mNode) return null;

                      const isRelevant = !hoveredId || n.id === hoveredId || fNode.id === hoveredId || mNode.id === hoveredId;
                      if (!showConnectors && !isRelevant) return null;

                      const parentMidX = (fNode.x + mNode.x) / 2;
                      const parentMidY = (fNode.y + mNode.y) / 2;

                      return (
                        <g key={`dual-parent-${n.id}`} opacity={isRelevant ? 1 : 0.25}>
                          {/* Arch connecting both parents */}
                          <path
                            d={`M${fNode.x},${fNode.y + 35} Q${parentMidX},${parentMidY + 50} ${mNode.x},${mNode.y + 35}`}
                            stroke="#10b981"
                            strokeWidth={isRelevant ? "2.5" : "1"}
                            strokeDasharray="4 2"
                            fill="none"
                          />
                          {/* Stem from parents down to child */}
                          <line
                            x1={parentMidX}
                            y1={parentMidY + 42}
                            x2={n.x}
                            y2={n.y - 35}
                            stroke="#10b981"
                            strokeWidth={isRelevant ? "2.5" : "1"}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>

              {/* ---------------- people ---------------- */}
              {layout.nodes.map((n) => {
                if (n.ghost) {
                    const target = byId.get(n.targetId);
                    const targetSide = target ? (sideMap ? sideMap.get(target.id) : target.side) : null;
                    const ghostSideMatched = !sideFilter || sideFilter === 'all' || targetSide === sideFilter || targetSide === 'both';
                    const ghostOpacity = ghostSideMatched ? 1 : (sideFilter !== 'all' ? 0.05 : 0.25);
                    return (
                      <div
                        key={n.id}
                        data-node
                        className="absolute flex flex-col items-center transition-opacity duration-300"
                        style={{ 
                          left: n.x - 50, 
                          top: n.y - 28, 
                          width: 100, 
                          zIndex: 5,
                          opacity: ghostOpacity,
                          pointerEvents: ghostSideMatched ? 'auto' : 'none'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => target && addRelation(target, n.ghostType)}
                          className="w-14 h-14 rounded-full border-2 border-dashed border-[#6b4a24] bg-[#f4e4c1]/70 text-[#5a3a1a] flex items-center justify-center shadow-md hover:bg-[#e9d3a3] hover:scale-110 hover:border-solid transition-all"
                          title={`Add ${n.ghostType} of ${target?.name || ''}`}
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                        <span className="mt-1 px-2 py-[1px] rounded bg-[#f4e4c1]/80 text-[10px] font-serif-vintage font-bold text-[#5a3a1a] whitespace-nowrap">
                          Add {n.ghostType === 'father' ? 'Father' : 'Mother'}
                        </span>
                      </div>
                    );
                  }

                  const m = n.member;
                  const isMe = n.isRoot;
                  const hovered = hoveredId === n.id;
                  const matched = isMatch(m);

                  const memberSide = sideMap ? sideMap.get(m.id) : m.side;
                  const sideMatched = !sideFilter || sideFilter === 'all' || memberSide === sideFilter || memberSide === 'both';
                  const opacityVal = matched && sideMatched ? 1 : (sideFilter !== 'all' ? 0.06 : 0.25);
                  const isMaternalActive = sideFilter === 'mother' && memberSide === 'mother';
                  const isPaternalActive = sideFilter === 'father' && memberSide === 'father';

                  const info = layout.parentInfo.get(m.id) || { count: 0 };
                  const canAddFather = !info.hasFather && info.count < 2;
                  const canAddMother = !info.hasMother && info.count < 2;
                  const popLeft = n.x > W / 2;

                  return (
                    <div
                      key={n.id}
                      data-node
                      onMouseEnter={() => handleEnter(n.id)}
                      onMouseLeave={() => handleLeave(n.id)}
                      onContextMenu={(e) => {
                        if (onOpenContextMenu) {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenContextMenu({ x: e.clientX, y: e.clientY, type: 'member', member: m });
                        }
                      }}
                      className="absolute transition-all duration-300"
                      style={{ 
                        left: n.x - 75, 
                        top: n.y - 45, 
                        width: 150, 
                        zIndex: hovered ? 50 : (sideMatched ? 15 : 5), 
                        opacity: opacityVal,
                        pointerEvents: sideMatched ? 'auto' : 'none',
                        filter: sideMatched ? 'none' : 'grayscale(100%)'
                      }}
                    >
                      <div className={`relative transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
                        {/* enchanted embroidery leaf behind the portrait */}
                        <svg width="116" height="139" viewBox="0 0 100 120" className="absolute pointer-events-none drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]" style={{ left: 17, top: -34 }}>
                          <path 
                            d={LEAF_PATH} 
                            fill={isMe ? 'url(#nodeLeafMe)' : isPaternalActive ? 'url(#nodeLeafGryffindor)' : 'url(#nodeLeaf)'} 
                            stroke={isMe ? '#d4af37' : isMaternalActive ? '#2ecc71' : isPaternalActive ? '#ef4444' : '#8a671d'} 
                            strokeWidth={isMe || isMaternalActive || isPaternalActive ? '2.5' : '1.8'} 
                          />
                          <path d="M50 6 L50 113" stroke={isMe ? '#78350f' : '#d4af37'} strokeWidth="1.2" strokeOpacity={isMe ? '0.6' : '0.4'} />
                          <path d={LEAF_VEINS} stroke={isMe ? '#78350f' : '#d4af37'} strokeWidth="1" strokeOpacity={isMe ? '0.5' : '0.35'} fill="none" />
                        </svg>

                        {/* portrait cameo medallion */}
                        <button
                          type="button"
                          onClick={() => onSelectMember(m)}
                          className={`relative block mx-auto mt-[5px] w-20 h-20 rounded-full p-[3px] shadow-[0_6px_16px_rgba(0,0,0,0.8)] cursor-pointer transition-all ${
                            isMe 
                              ? 'bg-gradient-to-tr from-[#d4af37] via-[#fef08a] to-[#d4af37] ring-4 ring-[#ffd700] shadow-[0_0_25px_rgba(212,175,55,0.7)]' 
                              : isMaternalActive
                              ? 'bg-[#0f2e1b] ring-4 ring-[#2ecc71] shadow-[0_0_20px_rgba(46,204,113,0.7)]'
                              : isPaternalActive
                              ? 'bg-[#450a0a] ring-4 ring-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                              : 'bg-[#122319] ring-2 ring-[#8a671d] hover:ring-[#d4af37]'
                          }`}
                          title={m.name}
                        >
                          <Avatar photo={m.photo} name={m.name} gender={m.gender} className="w-full h-full rounded-full sepia-photo" />
                          {isMe && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#fef08a] border-2 border-[#594215] flex items-center justify-center shadow-lg">
                              <Crown className="w-3.5 h-3.5 text-[#422d08]" />
                            </span>
                          )}
                          {isMaternalActive && !isMe && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1a472a] border border-[#2ecc71] flex items-center justify-center shadow text-[10px] text-[#a7f3d0] font-bold">
                              🐍
                            </span>
                          )}
                          {isPaternalActive && !isMe && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#740001] border border-[#d3a625] flex items-center justify-center shadow text-[10px] text-[#fef08a] font-bold">
                              🦁
                            </span>
                          )}
                        </button>

                        {/* member name banner */}
                        <div
                          className={`mx-auto mt-5 w-fit max-w-[150px] px-3 py-[3px] rounded-[3px] border shadow-[0_2px_8px_rgba(0,0,0,0.7)] text-[12px] leading-tight font-cinzel-dec font-bold truncate ${
                            isMe 
                              ? 'bg-gradient-to-r from-[#d4af37] via-[#fef08a] to-[#d4af37] border-[#78350f] text-[#3d2504] shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                              : isMaternalActive
                              ? 'bg-gradient-to-r from-[#0d2616] to-[#1a472a] border-[#2ecc71] text-[#a7f3d0] font-extrabold shadow-md'
                              : isPaternalActive
                              ? 'bg-gradient-to-r from-[#4a0203] to-[#740001] border-[#d3a625] text-[#fef08a] font-extrabold shadow-md'
                              : 'bg-[#102016] border-[#8a671d] text-[#fce7a1]'
                          }`}
                        >
                          {isMe ? `★ ${m.name}` : m.name}
                        </div>
                      </div>

                    {/* ---------------- hover details ---------------- */}
                    {hovered && (
                      <div className={`absolute top-[-14px] ${popLeft ? 'right-full pr-3' : 'left-full pl-3'}`}>
                        <div className="w-68 rounded-2xl bg-[#0d1a12]/98 border-2 border-[#d4af37] shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-4 text-[#fce7a1] cursor-default animate-in fade-in duration-150">
                          <div className="flex items-start gap-3 pb-3 border-b border-[#23422d]">
                            <Avatar photo={m.photo} name={m.name} gender={m.gender} className="w-12 h-12 rounded-xl border-2 border-[#d4af37] shadow" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-cinzel-dec font-bold text-sm text-[#fef08a] leading-tight">{m.name}</h3>
                              {m.maidenName && <p className="text-[11px] italic text-[#d4af37]/80">née {m.maidenName}</p>}
                              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#173322] border border-[#d4af37]/40 text-[#fef9c3] uppercase tracking-wider font-serif-vintage">
                                {resolveDetailedRelationship(m, members, 'me').relationLabel}
                              </span>
                            </div>
                          </div>

                          <div className="py-2.5 space-y-1 text-xs text-[#eedcb0]">
                            <p className="font-semibold text-[#f5d77f]">
                              {m.birthYear || '????'} – {m.isDeceased ? m.deathYear || '????' : 'Living'}
                              {m.isDeceased && <span className="ml-1 text-amber-300">🕯</span>}
                            </p>
                            {m.birthPlace && (
                              <p className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span className="truncate">{m.birthPlace}</span>
                              </p>
                            )}
                            {m.occupation && (
                              <p className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span className="truncate">{m.occupation}</span>
                              </p>
                            )}
                            {m.bio && <p className="italic text-[#fef08a]/80 line-clamp-3 pt-1">“{m.bio}”</p>}
                          </div>

                          <div className="pt-2 border-t border-[#23422d]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] mb-1.5 font-cinzel-dec">✦ Add Relative</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {canAddFather && (
                                <button onClick={() => addRelation(m, 'father')} className="branch-chip">
                                  <Plus className="w-3 h-3" /> Father
                                </button>
                              )}
                              {canAddMother && (
                                <button onClick={() => addRelation(m, 'mother')} className="branch-chip">
                                  <Plus className="w-3 h-3" /> Mother
                                </button>
                              )}
                              {!m.spouseId && (
                                <button onClick={() => addRelation(m, 'spouse')} className="branch-chip">
                                  <Heart className="w-3 h-3 text-rose-400" /> Spouse
                                </button>
                              )}
                              <button onClick={() => addRelation(m, 'sibling')} className="branch-chip">
                                <Users className="w-3 h-3" /> Sibling
                              </button>
                              <button onClick={() => addRelation(m, 'child')} className="branch-chip">
                                <Baby className="w-3 h-3" /> Child
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#23422d] flex items-center justify-between text-xs font-serif-vintage">
                            <button onClick={() => onSelectMember(m)} className="flex items-center gap-1 text-[#d4af37] hover:text-white">
                              <Eye className="w-3.5 h-3.5" /> Profile
                            </button>
                            <button onClick={() => onEditMember(m)} className="flex items-center gap-1 text-[#d4af37] hover:text-white">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            {!isMe && (
                              <button onClick={() => onDeleteMember(m.id)} className="flex items-center gap-1 text-rose-400 hover:text-rose-200">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= floating UI ================= */}
      {sideFilter !== 'all' && (
        <div data-ui className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-[#251509]/95 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-[#8c5828] shadow-2xl flex items-center gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full animate-ping" 
              style={{ backgroundColor: sideFilter === 'mother' ? '#ec4899' : '#3b82f6' }} 
            />
            <span className="text-xs font-serif-vintage font-bold text-amber-100 flex items-center gap-1.5">
              {sideFilter === 'mother' 
                ? "🌸 Viewing Mother's Side" 
                : "👨 Viewing Father's Side"}
            </span>
          </div>
          {onResetFilter && (
            <button
              onClick={onResetFilter}
              className="text-[11px] font-serif-vintage font-bold px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600 transition-all hover:scale-105"
            >
              ✕ Show All Members
            </button>
          )}
        </div>
      )}

      <div data-ui className="absolute top-4 left-5 z-30 hidden sm:block bg-[#2b1c0d]/90 text-amber-100 px-4 py-2.5 rounded-xl border-2 border-[#7a4f29] shadow-xl">
        <h2 className="font-serif-vintage text-sm font-bold tracking-widest uppercase text-amber-300 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" /> Family Tree
        </h2>
        <p className="text-[11px] text-amber-200/75 italic">Hover a person for details · click empty slots to add a parent</p>
      </div>

      <div data-ui className="absolute top-4 right-5 z-30 flex flex-col gap-1.5 bg-[#2b1c0d]/90 p-1.5 rounded-xl border-2 border-[#7a4f29] shadow-xl">
        <button onClick={() => zoomTo(zoomRef.current * 1.2)} className="tree-ctrl" title="Zoom in">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={() => zoomTo(zoomRef.current / 1.2)} className="tree-ctrl" title="Zoom out">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={() => zoomAndCenter(Math.min(1, fitZoom()), { x: W / 2, y: H / 2, fy: 0.5 })} className="tree-ctrl" title="Fit whole tree">
          <Maximize className="w-5 h-5" />
        </button>
        <button onClick={() => rootNode && centerOn(rootNode.x, rootNode.y, 0.62)} className="tree-ctrl" title="Center on me">
          <Target className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowGhosts((s) => !s)}
          className={`tree-ctrl ${showGhosts ? 'bg-emerald-800/70 text-emerald-200' : ''}`}
          title={showGhosts ? 'Hide empty branches' : 'Show empty branches'}
        >
          <Sprout className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowConnectors((s) => !s)}
          className={`tree-ctrl ${showConnectors ? 'bg-amber-700/80 text-amber-100 ring-2 ring-amber-400' : 'opacity-70'}`}
          title={showConnectors ? 'Connection Lines: ON (Click to Hide)' : 'Connection Lines: OFF (Clean View - Hover person to reveal)'}
        >
          <GitBranch className="w-5 h-5" />
        </button>
        <div className="text-[10px] font-mono text-center text-amber-400 font-bold pt-1 border-t border-[#52341b]">{Math.round(zoom * 100)}%</div>
      </div>

      {/* Empty / 1-Member Starter Helper Banner */}
      {members && members.length <= 1 && onLoadDemo && (
        <div data-ui className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-30 bg-[#251509]/95 backdrop-blur-md text-amber-100 px-4 py-2.5 rounded-2xl border-2 border-amber-600 shadow-2xl flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
          <div className="text-center sm:text-left">
            <p className="font-serif-vintage font-bold text-xs text-amber-200">
              🌱 Fresh Tree (Only Root Person Connected)
            </p>
            <p className="text-[10px] sm:text-[11px] text-amber-300/70">
              Want to see a complete tree with 4 generations, spouses, and branches?
            </p>
          </div>
          <button
            onClick={onLoadDemo}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-serif-vintage font-bold text-xs border border-amber-500 shadow-md transition-all hover:scale-105 shrink-0"
          >
            Explore 4-Gen Demo Tree
          </button>
        </div>
      )}

      <div data-ui className="absolute bottom-4 left-5 z-30 hidden md:block text-[11px] text-[#4a2e14] bg-[#f4e4c1]/80 border border-[#8c5828]/50 px-3 py-1.5 rounded-lg shadow">
        Drag or use scrollbars to move · <b>Ctrl + Scroll</b> to zoom
      </div>
    </div>
  );
}
