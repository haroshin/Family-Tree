import React from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Briefcase, 
  User, 
  Heart, 
  Award, 
  Edit3, 
  Trash2, 
  GitFork, 
  ArrowRight,
  Sparkles,
  Bookmark
} from 'lucide-react';

import Avatar from './Avatar';

export default function ProfileModal({
  member,
  members,
  onClose,
  onEdit,
  onDelete,
  onSelectRelative,
  onSetAsMe
}) {

  if (!member) return null;

  const father = members.find(m => m.id === member.fatherId);
  const mother = members.find(m => m.id === member.motherId);
  const spouse = members.find(m => m.id === member.spouseId);
  const children = members.filter(m => (member.childrenIds || []).includes(m.id) || m.fatherId === member.id || m.motherId === member.id);
  const siblings = members.filter(m => (member.siblingIds || []).includes(m.id));

  const isMe = member.id === 'me';

  // Calculate lifespan
  let lifespanText = 'Living';
  if (member.birthYear) {
    if (member.isDeceased && member.deathYear) {
      const age = parseInt(member.deathYear) - parseInt(member.birthYear);
      lifespanText = `${member.birthYear} – ${member.deathYear} (${isNaN(age) ? 'Deceased' : `${age} yrs`})`;
    } else if (!member.isDeceased) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - parseInt(member.birthYear);
      lifespanText = `${member.birthYear} – Present (${isNaN(age) ? 'Living' : `${age} yrs`})`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b160f] border-2 border-[#d4af37]/50 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] overflow-hidden my-8 tapestry-burnt-edges">
        
        {/* Profile Cover Banner - Enchanted Velvet & Constellations */}
        <div className="h-32 bg-gradient-to-r from-[#070e09] via-[#152e1c] to-[#070e09] border-b border-[#24422e] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,175,55,0.6) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
          <div className="absolute top-4 left-6 text-xs font-serif text-[#d4af37]/70 tracking-widest uppercase">
            ✦ House of Noble Lineage Folio ✦
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-[#740001] text-amber-200 hover:text-white backdrop-blur-md border border-[#2b4c34] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Header Profile Info */}
        <div className="px-6 pb-6 pt-0 relative text-amber-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-4">
            
            <div className="relative">
              <div className="p-1.5 rounded-3xl bg-gradient-to-b from-[#d4af37] via-[#8c6b2d] to-[#3a220d] shadow-2xl">
                <Avatar
                  photo={member.photo}
                  name={member.name}
                  gender={member.gender}
                  className="w-28 h-28 rounded-2xl border-2 border-[#122417] bg-[#07100a]"
                />
              </div>
              <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border border-[#d4af37]/50 ${
                member.gender === 'female' ? 'bg-[#740001]' : 'bg-[#1a472a]'
              }`}>
                {member.gender === 'female' ? '♀' : '♂'}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onEdit(member)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#09150d] hover:bg-[#122618] text-amber-200 text-xs font-serif font-semibold border border-[#2b4c34] hover:border-[#d4af37] transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                Inscribe Edits
              </button>

              {!isMe && (
                <button
                  onClick={() => onSetAsMe(member.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#740001]/30 hover:bg-[#740001] text-[#fef08a] hover:text-white text-xs font-serif font-semibold border border-[#d4af37]/40 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Crown as Progenitor
                </button>
              )}

              {!isMe && (
                <button
                  onClick={() => {
                    onDelete(member.id);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-[#1e0a0a]/60 hover:bg-[#740001] text-rose-300 hover:text-white border border-[#740001]/50 transition-colors"
                  title="Expel from Lineage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Name & Relation Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-['Cinzel_Decorative',serif] font-bold text-[#fef08a] tracking-wide">
                {member.name}
              </h2>
              {member.maidenName && (
                <span className="text-sm font-serif text-emerald-300/80 italic">
                  (House of {member.maidenName})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-serif font-bold ${
                isMe ? 'bg-[#740001]/40 text-[#fef08a] border border-[#d4af37]' : 'bg-[#1a472a]/40 text-emerald-200 border border-emerald-500/40'
              }`}>
                {member.relationToMe || (isMe ? 'Me (Noble Progenitor)' : 'Noble Kin')}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-serif font-medium bg-[#07100a] text-amber-200 border border-[#24422e] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#d4af37]" />
                {lifespanText}
              </span>

              {member.generation !== undefined && (
                <span className="px-2.5 py-1 rounded-full text-xs font-serif font-medium bg-[#b8860b]/20 text-[#fef08a] border border-[#d4af37]/30">
                  Gen {member.generation}
                </span>
              )}
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {member.birthPlace && (
              <div className="p-3 rounded-2xl bg-[#07100a] border border-[#233f2c] flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0e1f13] text-[#d4af37]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Ancestral Seat</span>
                  <span className="text-xs font-serif font-medium text-amber-100">{member.birthPlace}</span>
                </div>
              </div>
            )}

            {member.occupation && (
              <div className="p-3 rounded-2xl bg-[#07100a] border border-[#233f2c] flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0e1f13] text-[#d4af37]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Magical Calling</span>
                  <span className="text-xs font-serif font-medium text-amber-100">{member.occupation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Biography & Story */}
          {member.bio && (
            <div className="mt-6 p-4 rounded-2xl bg-[#07100a] border border-[#233f2c]">
              <h4 className="text-xs font-serif font-bold text-[#fef08a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#d4af37]" />
                Ancestral Lore & Deeds
              </h4>
              <p className="text-xs text-amber-200/90 leading-relaxed whitespace-pre-line font-serif">
                {member.bio}
              </p>
            </div>
          )}

          {/* Tags */}
          {member.tags && member.tags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {member.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#07100a] text-amber-300 text-[11px] border border-[#24422e] font-serif">
                  ✦ {tag}
                </span>
              ))}
            </div>
          )}

          {/* Immediate Relations Links */}
          <div className="mt-6 pt-6 border-t border-[#233f2c] space-y-4">
            <h4 className="text-xs font-serif font-bold text-emerald-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-[#d4af37] rotate-180" />
              Immediate Bloodline Threads
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Father */}
              {father ? (
                <div 
                  onClick={() => onSelectRelative(father)}
                  className="p-3 rounded-2xl bg-[#07100a] hover:bg-[#740001]/20 border border-[#24422e] hover:border-[#d4af37] cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <img src={father.photo} alt={father.name} className="w-10 h-10 rounded-xl object-cover border border-[#2b4c34]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-serif font-bold text-[#fef08a] uppercase tracking-wider block">🦁 Sire (Father)</span>
                    <span className="text-xs font-serif font-semibold text-amber-100 truncate block group-hover:text-[#fef08a]">{father.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#07100a]/50 border border-dashed border-[#24422e] text-xs font-serif text-emerald-600 flex items-center justify-between">
                  <span>Sire Unknown</span>
                </div>
              )}

              {/* Mother */}
              {mother ? (
                <div 
                  onClick={() => onSelectRelative(mother)}
                  className="p-3 rounded-2xl bg-[#07100a] hover:bg-[#1a472a]/30 border border-[#24422e] hover:border-emerald-400 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <img src={mother.photo} alt={mother.name} className="w-10 h-10 rounded-xl object-cover border border-[#2b4c34]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-serif font-bold text-emerald-300 uppercase tracking-wider block">🐍 Dam (Mother)</span>
                    <span className="text-xs font-serif font-semibold text-emerald-100 truncate block group-hover:text-emerald-200">{mother.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#07100a]/50 border border-dashed border-[#24422e] text-xs font-serif text-emerald-600 flex items-center justify-between">
                  <span>Dam Unknown</span>
                </div>
              )}

              {/* Spouse */}
              {spouse && (
                <div 
                  onClick={() => onSelectRelative(spouse)}
                  className="p-3 rounded-2xl bg-[#1f1509] hover:bg-[#33220d] border border-[#d4af37]/60 cursor-pointer transition-all flex items-center gap-3 group sm:col-span-2 shadow-md"
                >
                  <img src={spouse.photo} alt={spouse.name} className="w-10 h-10 rounded-xl object-cover border border-[#d4af37]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-serif font-bold text-[#fef08a] uppercase tracking-wider block">
                      💍 Betrothed ({spouse.gender === 'female' ? 'Wife' : 'Husband'})
                    </span>
                    <span className="text-xs font-serif font-semibold text-amber-100 truncate block group-hover:text-[#fef08a]">{spouse.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#d4af37] group-hover:translate-x-1 transition-all" />
                </div>
              )}

            </div>

            {/* Siblings */}
            {siblings.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-serif font-bold text-[#fef08a] uppercase tracking-wider block">
                  👫 Siblings ({siblings.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siblings.map((sib) => (
                    <div
                      key={sib.id}
                      onClick={() => onSelectRelative(sib)}
                      className="p-2.5 rounded-xl bg-[#07100a] hover:bg-[#122618] border border-[#24422e] cursor-pointer transition-all flex items-center gap-2.5 group"
                    >
                      <img src={sib.photo} alt={sib.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-serif font-semibold text-amber-300 block">
                          {sib.gender === 'female' ? '👧 Sister' : '👦 Brother'}
                        </span>
                        <span className="text-xs font-serif font-medium text-amber-100 truncate block group-hover:text-[#fef08a]">
                          {sib.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-serif font-bold text-emerald-300 uppercase tracking-wider block">
                  👶 Offspring & Descendants ({children.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => onSelectRelative(child)}
                      className="p-2.5 rounded-xl bg-[#07100a] hover:bg-[#122618] border border-[#24422e] cursor-pointer transition-all flex items-center gap-2.5 group"
                    >
                      <img src={child.photo} alt={child.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-serif font-semibold text-emerald-400 block">
                          {child.gender === 'female' ? '👧 Daughter' : '👦 Son'}
                        </span>
                        <span className="text-xs font-serif font-medium text-amber-100 truncate block group-hover:text-emerald-200">
                          {child.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
