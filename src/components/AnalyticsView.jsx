import React from 'react';
import { BarChart3, Users, Globe, Award, Calendar, Heart, Shield, Sparkles } from 'lucide-react';

export default function AnalyticsView({ members }) {
  const total = members.length;
  const males = members.filter(m => m.gender === 'male').length;
  const females = members.filter(m => m.gender === 'female').length;
  const others = members.filter(m => m.gender === 'other').length;
  const deceased = members.filter(m => m.isDeceased).length;
  const living = total - deceased;

  const maxGen = Math.max(...members.map(m => m.generation ?? 0), 0);

  // Group by birth places / countries
  const locationCounts = {};
  members.forEach(m => {
    if (m.birthPlace) {
      const country = m.birthPlace.split(',').pop().trim();
      locationCounts[country] = (locationCounts[country] || 0) + 1;
    }
  });

  // Group by occupations
  const occCounts = {};
  members.forEach(m => {
    if (m.occupation) {
      occCounts[m.occupation] = (occCounts[m.occupation] || 0) + 1;
    }
  });

  // Calculate average lifespan for deceased members
  let totalYears = 0;
  let deceasedWithAges = 0;
  members.forEach(m => {
    if (m.isDeceased && m.birthYear && m.deathYear) {
      const age = parseInt(m.deathYear) - parseInt(m.birthYear);
      if (!isNaN(age) && age > 0) {
        totalYears += age;
        deceasedWithAges++;
      }
    }
  });
  const avgLifespan = deceasedWithAges > 0 ? Math.round(totalYears / deceasedWithAges) : 'N/A';

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-[#070d09] tapestry-canvas text-amber-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-2xl flex items-center justify-between tapestry-burnt-edges">
          <div>
            <h2 className="text-xl font-['Cinzel_Decorative',serif] font-bold text-[#fef08a] flex items-center gap-2">
              <span className="text-xl">📊</span>
              Family Tree Statistics & Insights
            </h2>
            <p className="text-xs text-emerald-300/80 font-serif mt-1">
              Overview of family statistics, origins, professions, and longevity
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#07100a] text-[#fef08a] border border-[#d4af37]/40 shadow-sm">
            {maxGen + 1} Generations Documented
          </span>
        </div>

        {/* Top Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-serif">
          <div className="p-5 rounded-2xl bg-[#09150d] border border-[#24422e] shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#740001]/30 border border-[#d4af37]/40 text-[#fef08a]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Total Members</span>
              <span className="text-2xl font-['Cinzel',serif] font-bold text-[#fef08a]">{total}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#09150d] border border-[#24422e] shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#1a472a]/40 border border-emerald-500/40 text-emerald-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Generations Depth</span>
              <span className="text-2xl font-['Cinzel',serif] font-bold text-[#fef08a]">{maxGen + 1} Generations</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#09150d] border border-[#24422e] shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#b8860b]/30 border border-[#d4af37]/40 text-[#fef08a]">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Living vs Deceased</span>
              <span className="text-2xl font-['Cinzel',serif] font-bold text-[#fef08a]">{living} <span className="text-xs font-normal text-amber-200/70">living / {deceased} deceased</span></span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#09150d] border border-[#24422e] shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#1e293b]/50 border border-slate-600/40 text-[#fef08a]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-serif font-semibold text-emerald-300/80 block uppercase tracking-wider">Average Lifespan</span>
              <span className="text-2xl font-['Cinzel',serif] font-bold text-[#fef08a]">{avgLifespan} {avgLifespan !== 'N/A' && 'yrs'}</span>
            </div>
          </div>
        </div>

        {/* Detailed Charts / Breakdown Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-serif">
          
          {/* Geographic Origins */}
          <div className="p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-xl space-y-4 tapestry-burnt-edges">
            <h3 className="text-sm font-['Cinzel',serif] font-bold text-[#fef08a] uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#d4af37]" />
              Geographic Origins
            </h3>
            <div className="space-y-3">
              {Object.entries(locationCounts).length === 0 ? (
                <p className="text-xs text-emerald-600/70 italic">No birthplaces entered yet.</p>
              ) : (
                Object.entries(locationCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([loc, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={loc} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-amber-100">
                          <span>{loc}</span>
                          <span className="text-[#fef08a]">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#050b07] overflow-hidden border border-[#24422e]">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-[#740001] via-[#b8860b] to-[#1a472a]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Top Professions & Occupations */}
          <div className="p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-xl space-y-4 tapestry-burnt-edges">
            <h3 className="text-sm font-['Cinzel',serif] font-bold text-[#fef08a] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#d4af37]" />
              Occupations & Professions
            </h3>
            <div className="space-y-3">
              {Object.entries(occCounts).length === 0 ? (
                <p className="text-xs text-emerald-600/70 italic">No occupations entered yet.</p>
              ) : (
                Object.entries(occCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([occ, count]) => (
                    <div key={occ} className="flex items-center justify-between p-3 rounded-2xl bg-[#07100a] border border-[#24422e]">
                      <span className="text-xs font-semibold text-amber-100">{occ}</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#740001]/30 text-[#fef08a] border border-[#d4af37]/30">
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
