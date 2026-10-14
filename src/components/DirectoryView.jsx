import React, { useState } from 'react';
import { Users, Search, Filter, Calendar, MapPin, Briefcase, Edit3, Eye, Plus } from 'lucide-react';

export default function DirectoryView({
  members,
  onSelectMember,
  onEditMember,
  onAddMember,
  searchQuery,
  setSearchQuery
}) {
  const [filterGen, setFilterGen] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  const filteredMembers = members.filter(m => {
    // Search
    const matchesSearch = !searchQuery || (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.maidenName && m.maidenName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.relationToMe && m.relationToMe.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.birthPlace && m.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.occupation && m.occupation.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Filter Gen
    const matchesGen = filterGen === 'all' || (m.generation ?? 0).toString() === filterGen;

    // Filter Gender
    const matchesGender = filterGender === 'all' || m.gender === filterGender;

    return matchesSearch && matchesGen && matchesGender;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-[#070d09] tapestry-canvas text-amber-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0b160f] border-2 border-[#d4af37]/40 shadow-2xl tapestry-burnt-edges">
          <div>
            <h2 className="text-xl font-['Cinzel_Decorative',serif] font-bold text-[#fef08a] flex items-center gap-2">
              <span className="text-xl">📜</span>
              House Directory & Kin Index
            </h2>
            <p className="text-xs text-emerald-300/80 font-serif mt-1">
              Search and filter all noble souls inscribed upon the lineage tapestry
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap font-serif">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                placeholder="Search name, house, realm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#050b07] border border-[#274833] text-xs text-amber-100 placeholder:text-emerald-700 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] w-52"
              />
            </div>

            {/* Gen filter */}
            <select
              value={filterGen}
              onChange={(e) => setFilterGen(e.target.value)}
              className="bg-[#050b07] border border-[#274833] text-xs text-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            >
              <option value="all">All Generations</option>
              <option value="0">Gen 0 (Me & Contemporaries)</option>
              <option value="1">Gen 1 (Parents)</option>
              <option value="2">Gen 2 (Grandparents)</option>
              <option value="3">Gen 3 (Great-Grandparents)</option>
              <option value="-1">Descendants (Children)</option>
            </select>

            {/* Gender filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-[#050b07] border border-[#274833] text-xs text-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            >
              <option value="all">All Genders</option>
              <option value="male">Wizards ♂</option>
              <option value="female">Witches ♀</option>
              <option value="other">Other</option>
            </select>

          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-serif">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl bg-[#09150d] border ${
                m.id === 'me'
                  ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  : m.gender === 'female'
                  ? 'border-[#740001]/60'
                  : 'border-[#24422e]'
              } shadow-xl hover:border-[#d4af37] transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#2b4c34] group-hover:border-[#d4af37] transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#07100a] text-[#fef08a] border border-[#24422e]">
                      {m.relationToMe || 'Noble Kin'}
                    </span>
                    <h3 className="font-['Cinzel',serif] font-bold text-sm text-[#fef08a] truncate mt-1 group-hover:text-amber-200 transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-xs text-emerald-300/80 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-[#d4af37]" />
                      {m.birthYear || '????'} {m.isDeceased ? `– ${m.deathYear || '????'}` : '– Present'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#24422e] space-y-1 text-[11px] text-amber-200/80">
                  {m.birthPlace && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">{m.birthPlace}</span>
                    </div>
                  )}
                  {m.occupation && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Briefcase className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">{m.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#24422e] flex items-center justify-between">
                <button
                  onClick={() => onSelectMember(m)}
                  className="flex items-center gap-1 text-xs font-serif font-semibold text-[#fef08a] hover:text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                  View Folio
                </button>
                <button
                  onClick={() => onEditMember(m)}
                  className="p-1.5 rounded-lg bg-[#07100a] hover:bg-[#122618] text-[#fef08a] border border-[#24422e] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
