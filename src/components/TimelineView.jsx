import React from 'react';
import { Clock, Calendar, MapPin, Briefcase, User, Sparkles } from 'lucide-react';

export default function TimelineView({ members, onSelectMember }) {
  // Sort members chronologically by birth year
  const sortedMembers = [...members].sort((a, b) => {
    const yearA = parseInt(a.birthYear) || 9999;
    const yearB = parseInt(b.birthYear) || 9999;
    return yearA - yearB;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-[#070d09] tapestry-canvas text-amber-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-2xl flex items-center justify-between tapestry-burnt-edges">
          <div>
            <h2 className="text-xl font-['Cinzel_Decorative',serif] font-bold text-[#fef08a] flex items-center gap-2">
              <span className="text-xl">⏳</span>
              Family Timeline
            </h2>
            <p className="text-xs text-emerald-300/80 font-serif mt-1">
              Chronological order of births and life events across generations
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#07100a] text-[#fef08a] border border-[#d4af37]/40 shadow-sm">
            {sortedMembers.length} Members Listed
          </span>
        </div>

        {/* Timeline Spine */}
        <div className="relative border-l-2 border-[#d4af37]/40 ml-4 md:ml-8 space-y-8 py-4 font-serif">
          {sortedMembers.map((m, idx) => (
            <div key={m.id} className="relative pl-6 md:pl-10 group">
              
              {/* Timeline Dot Marker */}
              <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#070d09] ${
                m.id === 'me'
                  ? 'bg-[#fef08a] ring-4 ring-[#d4af37]/50 shadow-[0_0_10px_#d4af37]'
                  : m.gender === 'female'
                  ? 'bg-[#740001] ring-4 ring-[#740001]/30 shadow-[0_0_8px_#740001]'
                  : 'bg-[#1a472a] ring-4 ring-emerald-500/30 shadow-[0_0_8px_#10b981]'
              } transition-transform group-hover:scale-125`} />

              {/* Timeline Card */}
              <div 
                onClick={() => onSelectMember(m)}
                className="p-5 rounded-2xl bg-[#09150d] border border-[#24422e] hover:border-[#d4af37] shadow-xl cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="flex items-center gap-4">
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#2b4c34] group-hover:border-[#d4af37] transition-colors"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-['Cinzel',serif] font-bold text-[#fef08a]">
                          {m.birthYear ? `Born ${m.birthYear}` : 'Birth Year Unknown'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#07100a] text-amber-200 border border-[#24422e]">
                          {m.relationToMe || 'Relative'}
                        </span>
                        {m.generation !== undefined && (
                          <span className="text-[10px] text-emerald-400/80">
                            Gen {m.generation}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-['Cinzel',serif] font-bold text-[#fef08a] mt-1 group-hover:text-amber-200 transition-colors">
                        {m.name}
                      </h3>

                      <p className="text-xs text-emerald-300/80 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                        {m.birthYear || '????'} {m.isDeceased ? `– ${m.deathYear || '????'}` : '– Present'}
                      </p>
                    </div>
                  </div>

                  {m.birthPlace && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-200 sm:text-right bg-[#07100a] p-2.5 rounded-xl border border-[#24422e]">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span>{m.birthPlace}</span>
                    </div>
                  )}

                </div>

                {m.bio && (
                  <p className="text-xs text-amber-200/90 mt-3 pt-3 border-t border-[#24422e] line-clamp-2 italic font-serif">
                    "{m.bio}"
                  </p>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
