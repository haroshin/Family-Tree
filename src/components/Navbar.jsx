import React, { useState } from 'react';
import { 
  GitFork, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Sparkles, 
  BarChart3, 
  Clock, 
  LayoutGrid, 
  Users, 
  RotateCcw,
  Trees, 
  Scroll,
  LogOut,
  User,
  ChevronDown,
  Edit3,
  Check,
  X
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  sideFilter,
  setSideFilter,
  onAddMember,
  onResetTree,
  onLoadDemo,
  onExportJSON,
  onExportGEDCOM,
  onExportImage,
  onImportJSON,
  theme,
  setTheme,
  membersCount,
  currentUser,
  onLogout,
  sideMap,
  onUpdateTreeName
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Editable Tree Name State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(currentUser?.treeName || 'My Family Tree');

  const handleSaveTitle = (e) => {
    e.preventDefault();
    if (editedTitle.trim() && onUpdateTreeName) {
      onUpdateTreeName(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleStartEdit = () => {
    setEditedTitle(currentUser?.treeName || 'My Family Tree');
    setIsEditingTitle(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            onImportJSON(imported);
          } else {
            alert('Invalid JSON file format.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Compute counts for father's side and mother's side
  let fCount = 0;
  let mCount = 0;
  if (sideMap) {
    sideMap.forEach((v) => {
      if (v === 'father') fCount++;
      if (v === 'mother') mCount++;
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0b140e]/95 backdrop-blur-md border-b-2 border-[#8b6b23] text-amber-100 shadow-[0_4px_25px_rgba(0,0,0,0.8)] w-full">
      
      {/* ================= TIER 1: MAIN APP HEADER (Identity, Actions & Logout) ================= */}
      <div className="w-full px-3 sm:px-5 lg:px-6 border-b border-[#2d4734]/60">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* LEFT: Hogwarts Crest + EDITABLE Tapestry Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div 
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1a472a] via-[#102a1b] to-[#07130c] border-2 border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] cursor-pointer shrink-0 hover:scale-105 transition-transform"
              onClick={() => setActiveView('vintagetree')}
              title="Family Tree"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>

            <div className="min-w-0">
              {isEditingTitle ? (
                /* Inline Edit Title Form */
                <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 py-0.5">
                  <input
                    type="text"
                    autoFocus
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-[#08110b] border-2 border-[#d4af37] rounded-lg px-2.5 py-0.5 text-xs sm:text-sm font-cinzel-dec font-bold text-[#fef08a] focus:outline-none focus:ring-2 focus:ring-[#f5d77f] w-48 sm:w-80 shadow-inner"
                    placeholder="My Family Tree..."
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white shadow border border-emerald-500 transition-all"
                    title="Save title"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-all border border-stone-700"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Display Title with Edit Pencil Button */
                <div className="flex items-center gap-1.5">
                  <span 
                    onClick={handleStartEdit}
                    className="font-cinzel-dec font-bold text-sm sm:text-base lg:text-lg tracking-wider text-[#fce7a1] hover:text-white cursor-pointer transition-colors truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                    title="Click to rename your family tree"
                  >
                    {currentUser?.treeName || 'My Family Tree'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="p-1 rounded-md text-[#d4af37]/60 hover:text-[#fef08a] hover:bg-[#1a3824]/50 transition-all shrink-0"
                    title="Rename this family tree"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <p className="text-[10px] sm:text-[11px] text-[#c7aa60] font-serif-vintage truncate">
                  {membersCount} Members {currentUser ? `• Owner: ${currentUser.name}` : ''}
                </p>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-[10px] font-sans" title="Connected to MongoDB Server">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MongoDB
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Actions + USER ACCOUNT & SIGN OUT */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Search Input */}
            <div className="relative hidden md:block w-36 lg:w-44">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#d4af37]/70" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#122319] border border-[#40684c] text-[#fef9c3] text-xs rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-[#d4af37] font-serif-vintage placeholder:text-[#d4af37]/40 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#d4af37] hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* + Add Member Button */}
            <button
              onClick={() => onAddMember(null)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#856322] via-[#a37c2b] to-[#6d511b] hover:from-[#9c7529] hover:to-[#856322] text-[#fff9db] font-serif-vintage font-bold text-xs shadow-[0_2px_10px_rgba(212,175,55,0.25)] border border-[#e5c158] transition-all hover:scale-[1.02] shrink-0"
              title="Add a new family member"
            >
              <Plus className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Add Member</span>
            </button>

            {/* Export / Import Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#122319] hover:bg-[#1a3824] text-[#fce7a1] text-xs font-serif-vintage font-bold border border-[#40684c] transition-all shadow-sm"
                title="Export and import family tree"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Export / Import</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-[#0f1d14] border-2 border-[#8b6b23] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-[#d4af37] uppercase tracking-widest font-cinzel-dec">
                    Export Tree
                  </div>
                  <button
                    onClick={() => { onExportJSON(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2 font-serif-vintage"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => { onExportGEDCOM(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2 font-serif-vintage"
                  >
                    <Scroll className="w-3.5 h-3.5 text-[#d4af37]" />
                    Export GEDCOM (.ged)
                  </button>
                  <button
                    onClick={() => { onExportImage(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2 border-b border-[#2d4734] font-serif-vintage"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    Export as Image (PNG)
                  </button>

                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#d4af37] uppercase tracking-widest font-cinzel-dec">
                    Import & Templates
                  </div>
                  <label className="w-full text-left px-4 py-2 text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2 cursor-pointer font-serif-vintage">
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    Import JSON File
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                  </label>
                  <button
                    onClick={() => { onLoadDemo(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2 font-serif-vintage"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    Load 4-Generation Demo Tree
                  </button>
                  <button
                    onClick={() => { onResetTree(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-300 hover:bg-rose-950/60 flex items-center gap-2 font-serif-vintage"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    Reset Tree (Just Me)
                  </button>
                </div>
              )}
            </div>

            {/* USER PROFILE PILL & SIGN OUT */}
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1 border-l border-[#3a5a40]/60">
                
                {/* User Profile Pill */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowExportMenu(false);
                    }}
                    className="flex items-center gap-1.5 p-1 rounded-xl bg-[#122319] hover:bg-[#1a3824] text-[#fce7a1] border border-[#40684c] transition-all hover:border-[#d4af37] shadow-sm"
                    title={`Account: ${currentUser.name}`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.photo}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-[#d4af37] shrink-0"
                      />
                      {currentUser.authProvider === 'google' && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-xs">
                          <svg className="w-2 h-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="font-serif-vintage text-xs font-bold hidden xl:inline max-w-[80px] truncate text-[#fce7a1]">
                      {currentUser.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#d4af37]" />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0f1d14] border-2 border-[#8b6b23] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in">
                      <div className="flex items-center gap-3 pb-3 border-b border-[#2d4734]">
                        <div className="relative shrink-0">
                          <img
                            src={currentUser.photo}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#d4af37] shadow-md shrink-0"
                          />
                          {currentUser.authProvider === 'google' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#fce7a1] truncate font-cinzel-dec">
                            {currentUser.name}
                          </p>
                          <p className="text-[10px] text-amber-300/80 truncate font-serif-vintage">
                            {currentUser.treeName || 'My Family Tree'}
                          </p>
                          <p className="text-[10px] text-amber-400/60 truncate flex items-center gap-1 font-sans">
                            {currentUser.authProvider === 'google' && <span className="text-[9px] text-amber-200 bg-[#163821] px-1 py-0.2 rounded border border-[#2a683e]">Google</span>}
                            <span>{currentUser.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-950/60 hover:text-rose-100 flex items-center gap-2 font-serif-vintage transition-all"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SIGN OUT BUTTON */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4d0c12] to-[#2e070b] hover:from-[#6b121a] hover:to-[#4d0c12] border border-[#a82531]/80 hover:border-red-400 text-rose-200 hover:text-white text-xs font-serif-vintage font-bold shadow-md transition-all hover:scale-[1.03] shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* ================= TIER 2: WORKSPACE TOOLBAR (Views & Filters) ================= */}
      <div className="w-full px-3 sm:px-5 lg:px-6 bg-[#071109]/95 border-t border-[#233827]/70 py-1.5">
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          
          {/* LEFT: 6 View Modes Segmented Control */}
          <nav className="flex items-center gap-1 bg-[#0d1c12] p-1 rounded-xl border border-[#26442f] shrink-0">
            <button
              onClick={() => setActiveView('vintagetree')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'vintagetree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-[#f5d77f]" />
              Tree View
            </button>
            <button
              onClick={() => setActiveView('tree')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'tree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 rotate-180" />
              Chart View
            </button>
            <button
              onClick={() => setActiveView('pedigree')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'pedigree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Pedigree View
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'timeline'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'analytics'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Statistics
            </button>
            <button
              onClick={() => setActiveView('directory')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap ${
                activeView === 'directory'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Directory
            </button>
          </nav>

          {/* RIGHT: Family Side Lineage Filter Tabs */}
          <div className="flex items-center bg-[#0d1c12] p-1 rounded-xl border border-[#26442f] text-xs font-serif-vintage shrink-0">
            <button
              onClick={() => setSideFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                sideFilter === 'all'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fff9db] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-white hover:bg-[#1a3824]'
              }`}
              title="Show all family members"
            >
              All Members
            </button>
            <button
              onClick={() => setSideFilter('father')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                sideFilter === 'father'
                  ? 'bg-gradient-to-r from-[#740001] to-[#4a0203] text-[#fef08a] shadow-md border border-[#d3a625]'
                  : 'text-[#e58b88] hover:text-white hover:bg-[#3d0f13]'
              }`}
              title="Filter by Father's Side"
            >
              <span>Father's Side</span>
              {fCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#520001] text-[#fef08a] border border-[#d3a625]/60 font-bold">
                  {fCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSideFilter('mother')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                sideFilter === 'mother'
                  ? 'bg-gradient-to-r from-[#1a472a] to-[#0f2e1b] text-[#e2e8f0] shadow-md border border-[#2ecc71]'
                  : 'text-[#7ce4a8] hover:text-white hover:bg-[#13301e]'
              }`}
              title="Filter by Mother's Side"
            >
              <span>Mother's Side</span>
              {mCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#0d2616] text-[#a7f3d0] border border-[#2ecc71]/60 font-bold">
                  {mCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

    </header>
  );
}
