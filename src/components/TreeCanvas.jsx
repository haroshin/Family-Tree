import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Target, 
  User, 
  Heart, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  Award,
  Sparkles,
  Users
} from 'lucide-react';
import { resolveDetailedRelationship } from '../utils/treeUtils';

export default function TreeCanvas({
  members,
  onSelectMember,
  onAddRelation,
  onEditMember,
  onDeleteMember,
  searchQuery,
  theme,
  sideFilter = 'all',
  sideMap,
  onOpenContextMenu
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const containerRef = useRef(null);

  // Group members by generation
  // Generation 0: Me, Spouse, Siblings
  // Generation 1: Parents, Uncles, Aunts
  // Generation 2: Grandparents
  // Generation 3: Great-Grandparents
  // Generation -1: Children

  const meNode = members.find(m => m.id === 'me') || members[0];

  // Helper to check if node matches search query
  const isMatch = (member) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(q) ||
      (member.maidenName && member.maidenName.toLowerCase().includes(q)) ||
      (member.relationToMe && member.relationToMe.toLowerCase().includes(q)) ||
      (member.birthPlace && member.birthPlace.toLowerCase().includes(q)) ||
      (member.occupation && member.occupation.toLowerCase().includes(q))
    );
  };

  // Group members into generation layers
  const maxGen = Math.max(...members.map(m => m.generation ?? 0), 0);
  const minGen = Math.min(...members.map(m => m.generation ?? 0), 0);

  const generations = [];
  for (let g = maxGen; g >= minGen; g--) {
    const genMembers = members.filter(m => (m.generation ?? 0) === g);
    if (genMembers.length > 0) {
      generations.push({ level: g, members: genMembers });
    }
  }

  // Handle Canvas Drag / Pan
  const handleMouseDown = (e) => {
    if (e.target.closest('.node-card') || e.target.closest('.canvas-control')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.4), 2.0));
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        if (onOpenContextMenu) {
          e.preventDefault();
          onOpenContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas', member: null });
        }
      }}
      className="relative w-full h-[calc(100vh-4rem)] overflow-auto cursor-grab active:cursor-grabbing select-none bg-[#070d09] tapestry-canvas text-amber-100"
    >

      {/* Background Decorative Constellation Star Grid */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(212,175,55,0.5) 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Floating Canvas View Controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-[#0b160f]/90 backdrop-blur-md p-2 rounded-2xl border border-[#d4af37]/40 shadow-2xl canvas-control">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.0))}
          className="p-2 rounded-xl hover:bg-[#122618] text-amber-200 hover:text-white transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-[#d4af37]" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))}
          className="p-2 rounded-xl hover:bg-[#122618] text-amber-200 hover:text-white transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-[#d4af37]" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-xl hover:bg-[#122618] text-amber-200 hover:text-white transition-all"
          title="Center on Me / Reset View"
        >
          <Target className="w-5 h-5 text-emerald-400" />
        </button>
        <div className="text-[10px] text-center font-mono text-[#fef08a] font-bold py-1 border-t border-[#24422e]">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Tree Header Legend Banner */}
      <div className="absolute top-4 left-4 z-30 bg-[#0b160f]/90 backdrop-blur-md border border-[#d4af37]/40 px-4 py-2.5 rounded-2xl shadow-xl hidden sm:flex items-center gap-4 font-serif">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-400/40" />
          <span className="text-xs text-amber-200 font-medium">Male ♂</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#740001] ring-2 ring-rose-400/40" />
          <span className="text-xs text-amber-200 font-medium">Female ♀</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#fef08a] ring-2 ring-[#d4af37]/60" />
          <span className="text-xs text-[#fef08a] font-medium">Me (Root)</span>
        </div>
        <div className="h-3 w-px bg-[#24422e]" />
        <span className="text-xs text-emerald-300/80">
          ✨ Family Tree Chart
        </span>
      </div>

      {/* Transformable Canvas Content Container */}
      <div 
        className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        <div className="py-20 px-10 flex flex-col items-center gap-16 min-w-max">
          
          {generations.map(({ level, members: genMembers }) => {
            let genTitle = 'Generations';
            if (level === 0) genTitle = '⭐ Generation 0 (Me & Contemporaries)';
            else if (level === 1) genTitle = 'Generation 1 (Parents, Aunts & Uncles)';
            else if (level === 2) genTitle = 'Generation 2 (Grandparents)';
            else if (level >= 3) genTitle = `✦ Generation ${level} (Ancestors)`;
            else if (level < 0) genTitle = `🌱 Descendants & Children`;

            return (
              <div key={level} className="flex flex-col items-center gap-6 relative">
                
                {/* Generation Banner */}
                <div className="flex items-center gap-3">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]/60" />
                  <span className="px-3.5 py-1 rounded-full text-xs font-['Cinzel',serif] font-bold bg-[#0b160f]/90 text-[#fef08a] border border-[#d4af37]/40 shadow-md">
                    {genTitle}
                  </span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]/60" />
                </div>

                {/* Cards Grid for this Generation */}
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 font-serif">
                  {genMembers.map((member) => {
                    const isMe = member.id === 'me';
                    const matched = isMatch(member);
                    const isCollapsed = collapsedNodes.has(member.id);

                    const memberSide = sideMap ? sideMap.get(member.id) : member.side;
                    const sideMatched = !sideFilter || sideFilter === 'all' || memberSide === sideFilter || memberSide === 'both';
                    const isMaternalActive = sideFilter === 'mother' && memberSide === 'mother';
                    const isPaternalActive = sideFilter === 'father' && memberSide === 'father';

                    const opacityClass = matched && sideMatched 
                      ? (isMaternalActive ? 'opacity-100 scale-105 ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : isPaternalActive ? 'opacity-100 scale-105 ring-2 ring-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'opacity-100 scale-100')
                      : (sideFilter !== 'all' ? 'opacity-10 scale-90 pointer-events-none grayscale' : 'opacity-30 scale-95');

                    // Gender & house colors
                    const borderGlow = isMe 
                      ? 'ring-2 ring-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                      : isMaternalActive
                      ? 'border-emerald-500 shadow-emerald-500/20'
                      : isPaternalActive
                      ? 'border-[#740001] shadow-[#740001]/20'
                      : member.gender === 'female' 
                      ? 'ring-1 ring-rose-500/40 hover:ring-rose-400' 
                      : 'ring-1 ring-emerald-500/40 hover:ring-emerald-400';

                    const avatarBadgeBg = member.gender === 'female' 
                      ? 'bg-gradient-to-tr from-[#740001] to-rose-600' 
                      : 'bg-gradient-to-tr from-[#1a472a] to-emerald-600';

                    return (
                      <div
                        key={member.id}
                        onContextMenu={(e) => {
                          if (onOpenContextMenu) {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenContextMenu({ x: e.clientX, y: e.clientY, type: 'member', member });
                          }
                        }}
                        className={`node-card relative group flex flex-col items-center transition-all duration-300 ${opacityClass}`}
                      >
                        {/* Parent Connector Line upwards if ancestor */}
                        {(member.fatherId || member.motherId) && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-indigo-500/40 group-hover:bg-indigo-400 transition-colors" />
                        )}

                        {/* Card Box */}
                        <div 
                          onClick={() => onSelectMember(member)}
                          className={`w-64 p-4 rounded-2xl backdrop-blur-xl border bg-[#09150d] border-[#24422e] shadow-2xl ${borderGlow} cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]`}
                        >
                          {/* Header / Avatar & Badges */}
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={member.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                                alt={member.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2b4c34] shadow-inner group-hover:border-[#d4af37] transition-colors"
                              />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${avatarBadgeBg} flex items-center justify-center shadow-md text-[10px] text-white font-bold`}>
                                {member.gender === 'female' ? '♀' : '♂'}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(() => {
                                  const relInfo = resolveDetailedRelationship(member, members, 'me');
                                  return (
                                    <span className={`text-xs font-serif font-bold px-2 py-0.5 rounded-full ${
                                      isMe 
                                        ? 'bg-[#740001]/40 text-[#fef08a] border border-[#d4af37]' 
                                        : relInfo.relationCategory === 'spouse'
                                        ? 'bg-[#b8860b]/30 text-amber-200 border border-[#d4af37]/40 font-bold'
                                        : relInfo.relationCategory === 'sibling'
                                        ? 'bg-[#1a472a]/40 text-emerald-200 border border-emerald-500/40 font-bold'
                                        : 'bg-[#07100a] text-amber-200 border border-[#24422e]'
                                    }`}>
                                      {relInfo.relationLabel}
                                    </span>
                                  );
                                })()}

                                {member.isDeceased && (
                                  <span className="text-[10px] font-serif font-medium px-1.5 py-0.5 rounded-md bg-[#1e0a0a] text-rose-300 border border-rose-900/40">
                                    🕊 Passed
                                  </span>
                                )}
                              </div>

                              <h3 className="font-['Cinzel',serif] font-bold text-sm text-[#fef08a] truncate mt-1 group-hover:text-amber-200 transition-colors">
                                {member.name}
                              </h3>
                              
                              {member.maidenName && (
                                <p className="text-[11px] text-emerald-300/70 italic truncate font-serif">
                                  née {member.maidenName}
                                </p>
                              )}

                              <p className="text-xs text-amber-200/90 font-serif font-medium mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#d4af37] shrink-0" />
                                {member.birthYear || '????'}
                                {member.isDeceased ? ` – ${member.deathYear || '????'}` : ' – Present'}
                              </p>
                            </div>
                          </div>

                          {/* Extra info row */}
                          {(member.birthPlace || member.occupation) && (
                            <div className="mt-3 pt-2.5 border-t border-[#24422e] flex flex-col gap-1 text-[11px] text-amber-200/80 font-serif">
                              {member.birthPlace && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                                  <span className="truncate">{member.birthPlace}</span>
                                </div>
                              )}
                              {member.occupation && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Briefcase className="w-3 h-3 text-[#d4af37] shrink-0" />
                                  <span className="truncate">{member.occupation}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Action Footer */}
                          <div className="mt-3 pt-2 border-t border-[#24422e] flex items-center justify-between text-xs font-serif">
                            
                            {/* Add Parent / Relation Button */}
                            <div className="flex items-center gap-1">
                              {(!member.fatherId || !member.motherId) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddRelation(member, 'father');
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#740001]/30 hover:bg-[#740001] text-[#fef08a] hover:text-white transition-all text-[11px] font-medium border border-[#d4af37]/40"
                                  title="Add Parent (Father / Mother)"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Parent
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddRelation(member, 'spouse');
                                }}
                                className="p-1 rounded-lg bg-[#07100a] hover:bg-[#122618] text-amber-200 transition-all text-[11px] border border-[#24422e]"
                                title="Add Relative (Spouse/Sibling/Child)"
                              >
                                <Plus className="w-3.5 h-3.5 text-amber-300" />
                              </button>
                            </div>

                            {/* View / Edit / Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMember(member);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[#122618] text-amber-300 hover:text-[#fef08a] transition-colors"
                                title="Edit Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              
                              {!isMe && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteMember(member.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-[#740001]/60 text-rose-300 hover:text-white transition-colors"
                                  title="Delete Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
