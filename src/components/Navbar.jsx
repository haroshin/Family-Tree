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
  X,
  Cloud,
  Menu
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
  onUpdateTreeName,
  onManualSync,
  cloudSyncStatus = 'idle'
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
          
          {/* LEFT: Crest + EDITABLE Tapestry Title (Full width on left) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
            <div 
              className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1a472a] via-[#102a1b] to-[#07130c] border border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.3)] cursor-pointer shrink-0 hover:scale-105 transition-transform"
              onClick={() => setActiveView('vintagetree')}
              title="Family Tree"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            </div>

            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                /* Inline Edit Title Form */
                <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 py-0.5">
                  <input
                    type="text"
                    autoFocus
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-[#08110b] border-2 border-[#d4af37] rounded-lg px-2.5 py-0.5 text-xs sm:text-sm font-cinzel-dec font-bold text-[#fef08a] focus:outline-none focus:ring-2 focus:ring-[#f5d77f] w-full max-w-[260px] shadow-inner"
                    placeholder="My Family Tree..."
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white shadow border border-emerald-500 transition-all shrink-0"
                    title="Save title"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-all border border-stone-700 shrink-0"
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

            </div>
          </div>

          {/* RIGHT: SEARCH BAR + HAMBURGER MENU */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Search Input (all screen sizes) */}
            <div className="relative w-32 sm:w-44 lg:w-56">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#d4af37]/70" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-[#122319] border border-[#40684c] text-[#fef9c3] text-xs rounded-xl pl-8 pr-7 focus:outline-none focus:border-[#d4af37] font-serif-vintage placeholder:text-[#d4af37]/40 shadow-inner"
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

            {/* USER PROFILE PILL & MENU */}
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                
                {/* User Profile Pill */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm ${
                      showUserMenu
                        ? 'bg-amber-900/60 text-[#fef08a] border-amber-500'
                        : 'bg-[#122319] hover:bg-[#1a3824] text-[#d4af37] border-[#40684c] hover:border-[#d4af37]'
                    }`}
                    title="Menu"
                    aria-label="Open menu"
                  >
                    {showUserMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  {/* Comprehensive User Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 max-w-[92vw] bg-[#0f1d14] border-2 border-[#8b6b23] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] p-3 z-50 animate-in fade-in">
                      {/* User Info Header */}
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
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300 font-sans bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-600/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {cloudSyncStatus === 'syncing' ? 'Saving to Cloud...' : 'Auto-Saved to Cloud'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tree Actions Section */}
                      <div className="py-2 border-b border-[#2d4734] space-y-1">
                        <div className="px-3 py-1 text-[10px] font-bold text-[#d4af37] uppercase tracking-widest font-cinzel-dec">
                          Tree Actions
                        </div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onAddMember(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#fef08a] bg-[#162e1e] hover:bg-[#1f422b] flex items-center gap-2.5 font-serif-vintage font-bold border border-[#d4af37]/40 shadow-xs transition-all"
                        >
                          <Plus className="w-4 h-4 text-amber-300" />
                          <span>+ Add Family Member</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onExportImage();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2.5 font-serif-vintage transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Export as Image (PNG)</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onExportJSON();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2.5 font-serif-vintage transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Export as JSON</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onExportGEDCOM();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2.5 font-serif-vintage transition-all"
                        >
                          <Scroll className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Export GEDCOM (.ged)</span>
                        </button>
                        <label className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2.5 cursor-pointer font-serif-vintage transition-all">
                          <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Import JSON Backup</span>
                          <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>

                      {/* Templates & Demo */}
                      <div className="py-2 border-b border-[#2d4734] space-y-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLoadDemo();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-[#fce7a1] hover:bg-[#1a3824] flex items-center gap-2.5 font-serif-vintage transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Load 4-Gen Demo Tree</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onResetTree();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-rose-300 hover:bg-rose-950/60 flex items-center gap-2.5 font-serif-vintage transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                          <span>Reset Tree (Just Me)</span>
                        </button>
                      </div>

                      {/* Sign Out */}
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

              </div>
            )}

          </div>

        </div>
      </div>


      {/* ================= TIER 2: WORKSPACE TOOLBAR (Views & Filters) ================= */}
      <div className="w-full px-2 sm:px-5 lg:px-6 bg-[#071109]/95 border-t border-[#233827]/70 py-1.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-auto touch-scroll no-scrollbar">
          
          {/* LEFT: 6 View Modes Segmented Control */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-[#0d1c12] p-1 rounded-xl border border-[#26442f] shrink-0">
            <button
              onClick={() => setActiveView('vintagetree')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'vintagetree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-[#f5d77f] shrink-0" />
              <span className="hidden sm:inline">Tree View</span>
              <span className="sm:hidden">Tree</span>
            </button>
            <button
              onClick={() => setActiveView('tree')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'tree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 rotate-180 shrink-0" />
              <span className="hidden sm:inline">Chart View</span>
              <span className="sm:hidden">Chart</span>
            </button>
            <button
              onClick={() => setActiveView('pedigree')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'pedigree'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Pedigree View</span>
              <span className="sm:hidden">Pedigree</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'timeline'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Timeline
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'analytics'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </button>
            <button
              onClick={() => setActiveView('directory')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-serif-vintage font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                activeView === 'directory'
                  ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fef9c3] shadow-md border border-[#d4af37]'
                  : 'text-[#d4af37]/70 hover:text-[#fef08a] hover:bg-[#1a3824]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              Directory
            </button>
          </nav>

          {/* RIGHT: Family Side Lineage Filter Tabs (Desktop only; on mobile rendered on canvas) */}
          <div className="hidden md:flex items-center bg-[#0d1c12] p-1 rounded-xl border border-[#26442f] text-xs font-serif-vintage shrink-0">
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
