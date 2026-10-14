import React, { useEffect, useRef } from 'react';
import { 
  Plus, 
  User, 
  ChevronUp, 
  ChevronDown, 
  Heart, 
  Users, 
  Edit3, 
  Eye, 
  Trash2, 
  Crown, 
  Sparkles, 
  Target,
  GitBranch,
  Shield,
  Flower2
} from 'lucide-react';
import Avatar from './Avatar';

export default function ContextMenu({
  contextMenu, // { x, y, type: 'member' | 'canvas', member: object | null }
  onClose,
  onAddRelation,
  onEditMember,
  onSelectMember,
  onDeleteMember,
  onSetAsMe,
  onAddMember,
  onCenterView
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!contextMenu) return null;

  const { x, y, type, member } = contextMenu;

  // Adjust menu coordinates so it never overflows viewport
  const menuWidth = 260;
  const menuHeight = type === 'member' ? 380 : 220;

  const posX = Math.min(x, window.innerWidth - menuWidth - 12);
  const posY = Math.min(y, window.innerHeight - menuHeight - 12);

  return (
    <div
      ref={menuRef}
      style={{ left: `${posX}px`, top: `${posY}px` }}
      className="fixed z-50 w-64 bg-[#0b160f]/95 border-2 border-[#d4af37]/60 backdrop-blur-xl rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.25)] text-amber-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none tapestry-burnt-edges"
    >
      {type === 'member' && member ? (
        <div>
          {/* Member Header */}
          <div className="flex items-center gap-2.5 p-2 bg-[#07100a] rounded-xl border border-[#24422e] mb-2">
            <Avatar photo={member.photo} name={member.name} gender={member.gender} className="w-10 h-10 rounded-xl border border-[#d4af37]" />
            <div className="min-w-0 flex-1">
              <h4 className="font-['Cinzel',serif] font-bold text-xs text-[#fef08a] truncate">{member.name}</h4>
              <p className="text-[10px] text-amber-400 font-bold tracking-wide uppercase font-serif">
                {member.id === 'me' ? '★ Progenitor Root' : member.relationToMe || 'Noble Kin'}
              </p>
            </div>
          </div>

          {/* Context Options */}
          <div className="space-y-0.5 text-xs font-serif">
            <div className="px-2 py-1 text-[10px] font-bold text-[#d4af37] uppercase tracking-widest font-['Cinzel',serif]">
              📜 Inscribe Kinship Thread
            </div>

            {/* Above: Add Parent */}
            <button
              onClick={() => {
                onAddRelation(member, 'father');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#740001]/40 hover:text-[#fef08a] transition-colors text-amber-200"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🦁</span>
                Inscribe Sire (Father)
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Sire</span>
            </button>

            <button
              onClick={() => {
                onAddRelation(member, 'mother');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1a472a]/50 hover:text-emerald-200 transition-colors text-emerald-300"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🐍</span>
                Inscribe Dam (Mother)
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">Dam</span>
            </button>

            {/* Below: Add Child */}
            <button
              onClick={() => {
                onAddRelation(member, 'child');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#122618] hover:text-[#fef08a] transition-colors text-amber-200"
            >
              <span className="flex items-center gap-2">
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                Inscribe Offspring (Child)
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">Heir</span>
            </button>

            {/* Beside / Side: Spouse & Sibling */}
            <button
              onClick={() => {
                onAddRelation(member, 'spouse');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#122618] hover:text-[#fef08a] transition-colors text-amber-200"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-amber-400" />
                Inscribe Betrothed (Spouse)
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Alliance</span>
            </button>

            <button
              onClick={() => {
                onAddRelation(member, 'sibling');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#122618] hover:text-[#fef08a] transition-colors text-amber-200"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Inscribe Sibling
              </span>
              <span className="text-[10px] text-indigo-400/80 font-mono">Kin</span>
            </button>

            {/* House Lineage Fast Filter Action */}
            <button
              onClick={() => {
                onAddRelation(member, 'father');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#740001]/50 hover:text-[#fef08a] transition-colors text-amber-300"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Add to Gryffindor Paternal
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">🦁</span>
            </button>

            <button
              onClick={() => {
                onAddRelation(member, 'mother');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1a472a]/60 hover:text-emerald-200 transition-colors text-emerald-300"
            >
              <span className="flex items-center gap-2">
                <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
                Add to Slytherin Maternal
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">🐍</span>
            </button>

            <div className="my-1 border-t border-[#24422e]" />

            {/* Management & View Options */}
            <button
              onClick={() => {
                onSelectMember(member);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#122618] text-amber-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
              View Lineage Folio
            </button>

            <button
              onClick={() => {
                onEditMember(member);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#122618] text-amber-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
              Inscribe Member Details
            </button>

            {member.id !== 'me' && onSetAsMe && (
              <button
                onClick={() => {
                  onSetAsMe(member.id);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#740001]/50 text-[#fef08a] transition-colors font-bold"
              >
                <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                Crown as Root Progenitor
              </button>
            )}

            {member.id !== 'me' && onDeleteMember && (
              <button
                onClick={() => {
                  onDeleteMember(member.id);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#740001] text-rose-300 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Expel from Tapestry
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Right Click Canvas Background Menu */
        <div>
          <div className="p-2 bg-[#07100a] rounded-xl border border-[#24422e] mb-2 text-center">
            <h4 className="font-['Cinzel',serif] font-bold text-xs text-[#fef08a] flex items-center justify-center gap-1.5">
              <GitBranch className="w-4 h-4 text-[#d4af37]" /> Tapestry Arcana Menu
            </h4>
            <p className="text-[10px] text-emerald-400/70 italic font-serif">Workspace Inscriptions</p>
          </div>

          <div className="space-y-1 text-xs font-serif">
            <button
              onClick={() => {
                onAddMember(null, null);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#740001] via-[#941c1c] to-[#b8860b] hover:from-[#941c1c] hover:to-[#d4af37] text-[#fef08a] font-bold transition-all shadow-md border border-[#d4af37]/60"
            >
              <Plus className="w-4 h-4 text-[#fef08a]" />
              Inscribe New Bloodline Member
            </button>

            <button
              onClick={() => {
                onAddMember(null, 'father');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#740001]/40 text-amber-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              🦁 Add Gryffindor Paternal Sire
            </button>

            <button
              onClick={() => {
                onAddMember(null, 'mother');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1a472a]/50 text-emerald-300 transition-colors"
            >
              <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
              🐍 Add Slytherin Maternal Dam
            </button>

            {onCenterView && (
              <button
                onClick={() => {
                  onCenterView();
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#122618] text-[#fef08a] transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-[#d4af37]" />
                Center View on Progenitor ("Me")
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
