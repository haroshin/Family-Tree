import React from 'react';
import { GitFork, User, ArrowUpRight, Calendar, MapPin } from 'lucide-react';

export default function PedigreeView({ members, onSelectMember, theme }) {
  // Sort generations from 0 up to maxGen
  const maxGen = Math.max(...members.map(m => m.generation ?? 0), 0);
  
  const genColumns = [];
  for (let g = 0; g <= Math.min(maxGen, 4); g++) {
    const list = members.filter(m => (m.generation ?? 0) === g);
    genColumns.push({ gen: g, list });
  }

  const getGenLabel = (gen) => {
    if (gen === 0) return 'Me (Root)';
    if (gen === 1) return 'Parents & Siblings';
    if (gen === 2) return 'Grandparents';
    if (gen === 3) return 'Great-Grandparents';
    return `Generation ${gen}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-[#070d09] tapestry-canvas text-amber-100 overflow-x-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-2xl tapestry-burnt-edges">
          <div>
            <h2 className="text-xl font-['Cinzel_Decorative',serif] font-bold text-[#fef08a] flex items-center gap-2">
              <span className="text-xl">📜</span>
              Pedigree View
            </h2>
            <p className="text-xs text-emerald-300/80 font-serif mt-1">
              Family tree organized by generation columns
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-serif text-amber-200">
            <span className="px-3.5 py-1.5 rounded-full bg-[#07100a] border border-[#d4af37]/40 text-[#fef08a]">
              Generations: <strong className="text-[#fef08a] font-bold">{maxGen + 1} Generations</strong>
            </span>
          </div>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {genColumns.map(({ gen, list }) => (
            <div key={gen} className="space-y-4">
              
              {/* Column Header */}
              <div className="p-3.5 rounded-2xl bg-[#0e1f14] border border-[#d4af37]/30 flex items-center justify-between shadow-md">
                <span className="text-xs font-['Cinzel',serif] font-bold text-[#fef08a] uppercase tracking-wider">
                  {getGenLabel(gen)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#740001]/40 text-[#fef08a] border border-[#d4af37]/40">
                  {list.length} {list.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {/* Members Cards in this Generation */}
              <div className="space-y-3 font-serif">
                {list.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#07100a]/60 border border-dashed border-[#24422e] text-center text-xs text-emerald-600/70 font-serif">
                    No members recorded for this generation yet.
                  </div>
                ) : (
                  list.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onSelectMember(m)}
                      className={`p-4 rounded-2xl bg-[#09150d] border ${
                        m.id === 'me'
                          ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                          : m.gender === 'female'
                          ? 'border-[#740001]/60 hover:border-pink-400'
                          : 'border-[#24422e] hover:border-[#d4af37]'
                      } shadow-lg hover:shadow-2xl cursor-pointer transition-all hover:-translate-y-0.5 group`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#2b4c34] group-hover:border-[#d4af37] transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider font-['Cinzel',serif]">
                              {m.relationToMe || 'Relative'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-[#d4af37] transition-colors" />
                          </div>
                          <h4 className="font-['Cinzel',serif] font-bold text-xs text-[#fef08a] truncate group-hover:text-amber-200 transition-colors">
                            {m.name}
                          </h4>
                          <p className="text-[11px] text-emerald-300/80 mt-0.5">
                            {m.birthYear || '????'} {m.isDeceased ? `– ${m.deathYear || '????'}` : '– Present'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
