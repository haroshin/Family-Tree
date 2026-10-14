// Authentic Google OAuth 2.0 & Identity Services Manager
const GOOGLE_CLIENT_ID_KEY = 'ancestry_google_client_id_v1';

export const getGoogleClientId = () => {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim()) return envId.trim();

  try {
    const saved = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error('Error reading saved Google Client ID', e);
  }
  return '';
};

export const setGoogleClientId = (clientId) => {
  try {
    if (clientId && clientId.trim()) {
      localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
    } else {
      localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
    }
  } catch (e) {
    console.error('Error saving Google Client ID', e);
  }
};

/**
 * Safely parse a JWT ID Token from Google Identity Services
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT credential', e);
    return null;
  }
};

/**
 * Trigger authentic Google OAuth 2.0 Popup Window (accounts.google.com)
 * Opens real Google account chooser and retrieves verified Google profile
 */
export const triggerGoogleOAuthPopup = ({ clientId, onSuccess, onError }) => {
  if (!clientId || !clientId.trim()) {
    onError?.('A Google OAuth Client ID is required.');
    return;
  }

  if (!window.google?.accounts?.oauth2) {
    onError?.('Google Identity Services SDK is not loaded yet. Please verify your connection.');
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          onError?.(tokenResponse.error_description || tokenResponse.error);
          return;
        }

        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          });

          if (!res.ok) {
            throw new Error(`Google API returned status ${res.status}`);
          }

          const profile = await res.json();
          onSuccess?.({
            name: profile.name,
            email: profile.email,
            photo: profile.picture,
            googleId: profile.sub
          });
        } catch (err) {
          console.error('Failed to retrieve user info from Google', err);
          onError?.(err.message || 'Could not fetch user profile from Google.');
        }
      }
    });

    tokenClient.requestAccessToken();
  } catch (err) {
    console.error('Error starting Google OAuth flow', err);
    onError?.(err.message || 'Failed to start Google sign-in popup.');
  }
};
