import React, { useState, useEffect, useRef } from 'react';
import { getGoogleClientId, parseJwt, triggerGoogleOAuthPopup } from '../utils/googleAuth';
import GoogleOAuthSetupModal from './GoogleOAuthSetupModal';
import { Settings, ShieldCheck, AlertCircle } from 'lucide-react';

function GoogleOAuthButton({ onSuccess, onError }) {
  const [clientId, setClientId] = useState(getGoogleClientId());
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const googleBtnContainerRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep callback refs fresh without triggering re-renders
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Sync client ID from storage or env
  useEffect(() => {
    const id = getGoogleClientId();
    setClientId(id);
  }, []);

  // Initialize official Google Identity Services button if Client ID exists
  useEffect(() => {
    if (!clientId) return;

    let checkInterval;
    const initGis = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              setAuthLoading(false);
              const profile = parseJwt(response.credential);
              if (profile && profile.email) {
                onSuccessRef.current?.({
                  name: profile.name,
                  email: profile.email,
                  photo: profile.picture,
                  googleId: profile.sub
                });
              } else {
                const err = 'Failed to extract user profile from Google credential.';
                setLocalError(err);
                onErrorRef.current?.(err);
              }
            },
            auto_select: false,
            context: 'signin'
          });

          // Only render if container is empty to avoid flickering
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 320
            });
          }
          return true;
        } catch (e) {
          console.error('Error rendering official Google button', e);
        }
      }
      return false;
    };

    if (!initGis()) {
      checkInterval = setInterval(() => {
        if (initGis()) clearInterval(checkInterval);
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId]);

  const handleCustomButtonClick = () => {
    setLocalError('');
    if (!clientId) {
      // Need setup
      setIsSetupOpen(true);
      return;
    }

    setAuthLoading(true);
    triggerGoogleOAuthPopup({
      clientId,
      onSuccess: (profile) => {
        setAuthLoading(false);
        onSuccessRef.current?.(profile);
      },
      onError: (err) => {
        setAuthLoading(false);
        setLocalError(err);
        onErrorRef.current?.(err);
      }
    });
  };

  return (
    <div className="w-full space-y-2">
      {localError && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {clientId ? (
        <div className="space-y-2">
          {/* Official Google GIS Button Container */}
          <div className="flex justify-center" ref={googleBtnContainerRef}>
            {/* Fallback button while Google iframe is mounting */}
            <button
              type="button"
              disabled={authLoading}
              onClick={handleCustomButtonClick}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-sans font-semibold text-xs sm:text-sm border border-stone-300 shadow-md flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{authLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-amber-400/60 font-serif-vintage">
            <span className="flex items-center gap-1 text-emerald-400/80">
              <ShieldCheck className="w-3 h-3" />
              <span>Real Google OAuth Connected</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="hover:text-amber-200 underline flex items-center gap-1"
            >
              <Settings className="w-2.5 h-2.5" />
              <span>Change Client ID</span>
            </button>
          </div>
        </div>
      ) : (
        /* If no Client ID configured yet, show authentic Google button that guides user through setup */
        <div>
          <button
            type="button"
            onClick={() => setIsSetupOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-sans font-semibold text-xs sm:text-sm border border-stone-300 shadow-md flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          <p className="text-[10px] text-amber-400/50 text-center font-serif-vintage mt-1">
            Click to configure Google OAuth Client ID for real accounts
          </p>
        </div>
      )}

      {/* Setup Modal */}
      <GoogleOAuthSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onClientConfigured={(newId) => {
          setClientId(newId);
        }}
      />
    </div>
  );
}

export default React.memo(GoogleOAuthButton);
