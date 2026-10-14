import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, KeyRound, CheckCircle2, Copy } from 'lucide-react';
import { getGoogleClientId, setGoogleClientId } from '../utils/googleAuth';

export default function GoogleOAuthSetupModal({ isOpen, onClose, onClientConfigured }) {
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId() || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentOrigin = window.location.origin || 'http://localhost:5173';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    if (!trimmed) {
      setError('Please paste your Google OAuth Client ID.');
      return;
    }
    if (!trimmed.includes('.apps.googleusercontent.com') && trimmed.length < 20) {
      setError('Invalid format. A Google Client ID typically ends with .apps.googleusercontent.com');
      return;
    }

    setGoogleClientId(trimmed);
    setError('');
    if (onClientConfigured) {
      onClientConfigured(trimmed);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#1e1309] border-2 border-amber-600/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative text-amber-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#150c05] px-6 py-4 border-b border-[#4d2d14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif-vintage font-bold text-amber-100">
                Google OAuth 2.0 Setup Required
              </h2>
              <p className="text-[11px] text-amber-300/60 font-serif-vintage">
                Connect your Google Cloud Client ID for real Google account sign-in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-400/60 hover:text-amber-100 hover:bg-[#2b180a] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="p-3.5 rounded-2xl bg-[#291708] border border-amber-600/40 text-amber-200 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-200 text-xs">
                How Google Sign-In Works
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Just like all other production websites, Google only opens its native account login popup after you register a free Client ID in your Google Cloud account.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 text-xs text-amber-200/90 font-sans">
            <h3 className="font-serif-vintage font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Easy 2-Minute Setup Steps:
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#140b05] border border-[#4d2d14] flex gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-amber-100 font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <div className="min-w-0">
                  <p className="font-bold text-amber-100">Open Google Cloud Credentials Console</p>
                  <p className="text-[11px] text-amber-300/70 pt-0.5">
                    Navigate to the Google Cloud APIs & Services console:
                  </p>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[11px] border border-amber-600 font-medium transition-all"
                  >
                    <span>Open Google Cloud Credentials</span>
                    <ExternalLink className="w-3 h-3 text-amber-300" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#140b05] border border-[#4d2d14] flex gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-amber-100 font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <div className="min-w-0">
                  <p className="font-bold text-amber-100">Create OAuth Client ID</p>
                  <p className="text-[11px] text-amber-300/70 pt-0.5">
                    Click <strong>+ CREATE CREDENTIALS</strong> → Select <strong>OAuth client ID</strong> → Choose <strong>Web application</strong> as Application type.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#140b05] border border-[#4d2d14] flex gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-amber-100 font-bold flex items-center justify-center text-xs shrink-0">3</span>
                <div className="min-w-0">
                  <p className="font-bold text-amber-100">Add Authorized JavaScript Origin</p>
                  <p className="text-[11px] text-amber-300/70 pt-0.5">
                    Under <strong>Authorized JavaScript origins</strong>, add this exact URL:
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="bg-[#241508] px-2.5 py-1 rounded border border-[#52341b] text-amber-200 font-mono text-[11px]">
                      {currentOrigin}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="px-2 py-1 rounded bg-[#3d2713] hover:bg-[#52341b] text-amber-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#140b05] border border-[#4d2d14] flex gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-amber-100 font-bold flex items-center justify-center text-xs shrink-0">4</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-amber-100">Paste Your Client ID</p>
                  <p className="text-[11px] text-amber-300/70 pt-0.5 mb-2">
                    Copy the generated Client ID (ends with <code className="text-amber-400">.apps.googleusercontent.com</code>) and paste it below:
                  </p>

                  <form onSubmit={handleSave} className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456789-abc123xyz.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full bg-[#1c1107] border border-[#5a3617] rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-amber-600/40 focus:outline-none focus:border-amber-500 font-mono"
                    />

                    {error && (
                      <p className="text-[11px] text-rose-300">{error}</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-amber-400/60">
                        Or add to your <code className="text-amber-300">.env</code> file: <br />
                        <code className="text-amber-300">VITE_GOOGLE_CLIENT_ID=your_id</code>
                      </p>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-serif-vintage font-bold text-xs border border-amber-500 shadow-md transition-all hover:scale-105"
                      >
                        Save & Activate
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#150c05] px-6 py-3 border-t border-[#3e230e] text-center text-[10px] text-amber-400/50 font-serif-vintage">
          Google Identity Services strictly enforces authorized origins for client-side security
        </div>
      </div>
    </div>
  );
}
