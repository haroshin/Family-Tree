import React, { useState, useCallback } from 'react';
import { 
  Trees, 
  Lock, 
  Mail, 
  User, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  BookOpen, 
  Scroll,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { loginUser, registerUser, getStoredUsers, loginOrRegisterWithGoogle } from '../utils/authUtils';
import { AVATAR_PRESETS } from '../data/avatars';
import GoogleOAuthButton from './GoogleOAuthButton';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState('male');
  const [regBirthYear, setRegBirthYear] = useState('1998');
  const [regTreeName, setRegTreeName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS.male[1].url);

  // Available users saved on this browser
  const storedUsers = getStoredUsers();

  const handleGenderChange = (gender) => {
    setRegGender(gender);
    if (gender === 'female') {
      setSelectedAvatar(AVATAR_PRESETS.female[0].url);
    } else if (gender === 'male') {
      setSelectedAvatar(AVATAR_PRESETS.male[1].url);
    } else {
      setSelectedAvatar(AVATAR_PRESETS.neutral[0].url);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(loginEmail, loginPassword);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        gender: regGender,
        birthYear: regBirthYear,
        treeName: regTreeName || `${regName.trim()}'s Family Tree`,
        photo: selectedAvatar
      });
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (profile) => {
    try {
      const user = await loginOrRegisterWithGoogle({
        name: profile.name,
        email: profile.email,
        photo: profile.photo,
        googleId: profile.googleId
      });
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    }
  }, [onLoginSuccess]);

  const handleGoogleError = useCallback((err) => {
    setError(err || 'Failed to authenticate with Google.');
  }, []);

  const handleQuickSwitchUser = async (user) => {
    if (user.authProvider === 'google') {
      onLoginSuccess(user);
      return;
    }
    setLoginEmail(user.email);
    setLoginPassword(user.password || 'password123');
    try {
      const logged = await loginUser(user.email, user.password || 'password123');
      onLoginSuccess(logged);
    } catch (err) {
      setError(`Please enter the password for ${user.name}`);
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#071109] text-amber-100 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Enchanted Candlelight and Emerald Tapestry Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#8b6b23]/25 rounded-full blur-3xl" />
      </div>

      {/* Medieval Cross-Hatch Tapestry Weave Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, #10b981 0px, #10b981 1px, transparent 1px, transparent 12px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-[#2d4734]/80 bg-[#0b160f]/95 backdrop-blur-md px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1a472a] via-[#112d1b] to-[#07160c] border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-cinzel-dec font-bold text-xl text-[#fce7a1] tracking-wider drop-shadow">
                Family Tree
              </h1>
              <p className="text-[11px] text-[#d4af37]/75 font-serif-vintage tracking-widest">
                Interactive Visual Family Tree & Genealogy Builder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#d4af37]/80 font-serif-vintage hidden sm:flex">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Private & Secure Trees Per Account</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 py-8 w-full flex flex-col justify-center">
        
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#122619] border border-[#d4af37]/60 text-[#fef08a] text-xs font-serif-vintage mb-3 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Family Tree & Genealogy Builder</span>
          </div>
          <h2 className="font-cinzel-dec text-3xl sm:text-4xl font-bold text-[#fce7a1] tracking-wide mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Build Your Family Tree
          </h2>
          <p className="text-sm text-amber-200/80 font-serif-vintage">
            Sign in to explore your family tree, or create a new family tree from scratch.
          </p>
        </div>

        {/* Central Auth Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto w-full">
          
          {/* Main Form Box (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d1a12]/95 border-2 border-[#8b6b23] rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
            
            {/* Top Ornamental Edge with Gold Foil Shimmer */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            {/* Mode Switch Tabs */}
            <div className="flex bg-[#07120a] p-1.5 rounded-2xl border border-[#23422d] mb-6">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-serif-vintage font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fff9db] shadow-lg border border-[#d4af37]'
                    : 'text-[#d4af37]/70 hover:text-white hover:bg-[#162e1e]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-serif-vintage font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#856322] to-[#594215] text-[#fff9db] shadow-lg border border-[#d4af37]'
                    : 'text-[#d4af37]/70 hover:text-white hover:bg-[#162e1e]'
                }`}
              >
                <Trees className="w-4 h-4 text-amber-300" />
                Create New Tree
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-2.5 shadow-md">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Authentic Google OAuth Action */}
            <div className="mb-5">
              <GoogleOAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-[#4d2d14]" />
                <span className="px-3 text-[10px] sm:text-[11px] font-serif-vintage text-amber-400/50 uppercase tracking-widest text-center">
                  or sign in with email & password
                </span>
                <div className="flex-1 border-t border-[#4d2d14]" />
              </div>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400/60" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@ancestry.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400/60" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-10 pr-10 py-2.5 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-amber-400/60 hover:text-amber-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-serif-vintage font-bold text-sm border border-amber-600 shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <span>Open My Family Tree</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                </div>

                {/* Quick Hint */}
                <div className="pt-2 text-center">
                  <p className="text-[11px] text-amber-400/60 font-serif-vintage">
                    Don't have a family tree yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(''); }}
                      className="text-amber-300 underline font-bold hover:text-white"
                    >
                      Create one in 10 seconds
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                    Your Full Name <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400/60" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (!regTreeName) {
                          // Auto hint tree name
                          setRegTreeName(e.target.value ? `The ${e.target.value.split(' ').pop()} Family Tree` : '');
                        }
                      }}
                      className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                  <p className="text-[10px] text-amber-400/60 mt-1">This will be the root person ("Me") in your new tree.</p>
                </div>

                {/* Email and Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                      Email Address <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60" />
                      <input
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                      Password <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60" />
                      <input
                        type="password"
                        required
                        placeholder="At least 4 chars"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender & Birth Year Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-[#160c05] p-1 rounded-xl border border-[#533116]">
                      <button
                        type="button"
                        onClick={() => handleGenderChange('male')}
                        className={`py-1.5 text-xs rounded-lg font-serif-vintage transition-all ${
                          regGender === 'male' ? 'bg-blue-900/80 text-blue-200 border border-blue-600 font-bold' : 'text-amber-300/60 hover:text-amber-200'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderChange('female')}
                        className={`py-1.5 text-xs rounded-lg font-serif-vintage transition-all ${
                          regGender === 'female' ? 'bg-pink-900/80 text-pink-200 border border-pink-600 font-bold' : 'text-amber-300/60 hover:text-amber-200'
                        }`}
                      >
                        Female
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderChange('other')}
                        className={`py-1.5 text-xs rounded-lg font-serif-vintage transition-all ${
                          regGender === 'other' ? 'bg-amber-800 text-amber-100 border border-amber-600 font-bold' : 'text-amber-300/60 hover:text-amber-200'
                        }`}
                      >
                        Other
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                      Birth Year
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60" />
                      <input
                        type="number"
                        placeholder="e.g. 1995"
                        value={regBirthYear}
                        onChange={(e) => setRegBirthYear(e.target.value)}
                        className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Tree Name (Optional) */}
                <div>
                  <label className="block text-xs font-serif-vintage font-bold text-amber-300 mb-1.5">
                    Family Tree Title (Optional)
                  </label>
                  <div className="relative">
                    <Scroll className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400/60" />
                    <input
                      type="text"
                      placeholder="e.g. The Vance Family Tree"
                      value={regTreeName}
                      onChange={(e) => setRegTreeName(e.target.value)}
                      className="w-full bg-[#160c05] border border-[#533116] rounded-xl pl-10 pr-3.5 py-2 text-xs text-amber-100 placeholder:text-amber-500/40 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                </div>

                {/* Submit Register Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-serif-vintage font-bold text-sm border border-amber-600 shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Trees className="w-4 h-4 text-amber-300" />
                    <span>Create Family Tree</span>
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[11px] text-amber-400/60 font-serif-vintage">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="text-amber-300 underline font-bold hover:text-white"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </form>
            )}

          </div>

          {/* Right Column: Saved Profiles & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Saved Accounts on this Browser */}
            {storedUsers && storedUsers.length > 0 && (
              <div className="bg-[#1c1107]/90 border border-[#523317] rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-serif-vintage font-bold text-amber-300">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Family Trees on this Device ({storedUsers.length})</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {storedUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleQuickSwitchUser(u)}
                      className="p-2.5 rounded-xl bg-[#28180c]/80 hover:bg-[#382211] border border-[#533519] flex items-center justify-between cursor-pointer transition-all hover:border-amber-600 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={u.photo}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-amber-600/70 shrink-0"
                          />
                          {u.authProvider === 'google' && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
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
                          <p className="text-xs font-bold text-amber-200 truncate font-serif-vintage">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-amber-400/60 truncate">
                            {u.treeName || u.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-amber-400 font-serif-vintage group-hover:text-amber-200 font-bold shrink-0 ml-2">
                        Open Tree →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Highlights Card */}
            <div className="bg-[#180e06]/80 border border-[#442710] rounded-2xl p-4 text-xs font-serif-vintage text-amber-300/75 space-y-2">
              <div className="flex items-center gap-2 text-amber-200 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Multi-User Isolated Storage</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-400/60 pl-5">
                Every person who creates a family tree has their own private records stored safely under their profile.
              </p>
              
              <div className="flex items-center gap-2 text-amber-200 font-bold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dual-Parent Child Linking</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-400/60 pl-5">
                Adding children links both father & mother automatically, keeping marital and sibling branches in sync.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1a3824] bg-[#071109]/90 py-3 text-center text-[11px] text-[#d4af37]/70 font-serif">
        <span>Family Tree • Interactive Visual Genealogy</span>
      </footer>

    </div>
  );
}
