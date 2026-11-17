// Authentication and Multi-User Isolated Tree Storage Manager (MongoDB + Strict Per-User Cache)
import { INITIAL_FAMILY_TREE, JUST_ME_TEMPLATE } from '../data/initialData';
import { updateGenerations } from './treeUtils';
import { getDefaultAvatar } from '../data/avatars';
import { authApi, treeApi, getAuthToken, setAuthToken } from '../services/api';

const USERS_KEY = 'ancestry_registered_users_v1';
const ACTIVE_USER_KEY = 'ancestry_active_session_v1';
const LEGACY_SHARED_TREE_KEY = 'ancestry_family_tree_v1';
const LEGACY_USER_TREE_PREFIX = 'ancestry_tree_user_';
const ISOLATED_TREE_PREFIX = 'ancestry_isolated_tree_v2_';

// Seed default demo user
export const DEFAULT_DEMO_USER = {
  id: 'user_alex_morgan',
  name: 'Alex Morgan',
  email: 'alex@ancestry.com',
  gender: 'male',
  photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  treeName: 'The Morgan Heritage Tree',
  createdAt: '2026-01-01'
};

// Purge legacy shared/contaminated localStorage tree keys so one user's tree never leaks to another
export const purgeLegacySharedTreeKeys = () => {
  try {
    localStorage.removeItem(LEGACY_SHARED_TREE_KEY);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_USER_TREE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Failed to purge legacy tree keys:', e);
  }
};

// Decode user ID from backend JWT token to ensure token strictly matches active user
const decodeJwtUserId = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload?.id ? String(payload.id) : null;
  } catch {
    return null;
  }
};

// Strip sensitive fields before saving user metadata to localStorage
const sanitizeUserForStorage = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeUserForStorage);
      }
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }
  const initial = [DEFAULT_DEMO_USER];
  localStorage.setItem(USERS_KEY, JSON.stringify(initial));
  return initial;
};

export const saveStoredUsers = (users) => {
  try {
    const sanitized = (users || []).map(sanitizeUserForStorage);
    localStorage.setItem(USERS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save users', e);
  }
};

const upsertStoredUser = (user) => {
  if (!user || !user.id) return;
  const users = getStoredUsers();
  const safe = sanitizeUserForStorage(user);
  const idx = users.findIndex(
    (u) => String(u.id) === String(safe.id) || (u.email && safe.email && u.email.toLowerCase() === safe.email.toLowerCase())
  );
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...safe };
  } else {
    users.push(safe);
  }
  saveStoredUsers(users);
};

export const getActiveUser = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      // Verify that if a JWT token is present, it belongs to this active user
      const token = getAuthToken();
      if (token && user?.id && user.id !== DEFAULT_DEMO_USER.id) {
        const tokenUserId = decodeJwtUserId(token);
        if (tokenUserId && tokenUserId !== String(user.id)) {
          setAuthToken(null);
        }
      }
      return user;
    }
  } catch (e) {
    console.error('Failed to load active session', e);
  }
  return null;
};

export const setActiveUser = (user) => {
  try {
    if (user) {
      const safe = sanitizeUserForStorage(user);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safe));
      upsertStoredUser(safe);
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to update active session', e);
  }
};

// Build a clean starter tree for a specific user (only their own "Me" root node)
export const createStarterTreeForUser = (user) => {
  if (!user) return [];
  if (user.id === DEFAULT_DEMO_USER.id) {
    return updateGenerations(INITIAL_FAMILY_TREE, 'me');
  }
  const starter = [
    {
      ...JUST_ME_TEMPLATE[0],
      id: 'me',
      name: user.name || 'Me',
      gender: user.gender || 'male',
      photo: user.photo || getDefaultAvatar(user.gender || 'male'),
      birthYear: user.birthYear || '1998',
      relationToMe: 'Me'
    }
  ];
  return updateGenerations(starter, 'me');
};

export const loginUser = async (email, password) => {
  purgeLegacySharedTreeKeys();
  // Always clear any previous user's token before logging in
  setAuthToken(null);

  const normalizedEmail = (email || '').trim().toLowerCase();

  // Built-in Demo User offline shortcut
  if (normalizedEmail === DEFAULT_DEMO_USER.email && password === 'password123') {
    setActiveUser(DEFAULT_DEMO_USER);
    return DEFAULT_DEMO_USER;
  }

  // Authenticate against MongoDB Backend
  const res = await authApi.login(normalizedEmail, password);
  if (res?.user) {
    setActiveUser(res.user);
    return res.user;
  }

  throw new Error('Invalid email or password. Please try again.');
};

export const registerUser = async ({ name, email, password, gender = 'male', birthYear = '', treeName = '', photo = null }) => {
  if (!name.trim()) throw new Error('Please enter your full name.');
  if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');

  purgeLegacySharedTreeKeys();
  // Clear any previous user's auth token before creating a new account
  setAuthToken(null);

  const resolvedPhoto = photo || getDefaultAvatar(gender);
  const resolvedTreeName = treeName?.trim() || `${name.trim()}'s Family Tree`;

  // Register on MongoDB Backend
  const res = await authApi.register({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    gender,
    birthYear: birthYear || String(new Date().getFullYear() - 25),
    treeName: resolvedTreeName,
    photo: resolvedPhoto
  });

  if (res?.user) {
    // Initialize this new user's isolated local tree with ONLY their own root node
    const starterTree = createStarterTreeForUser(res.user);
    saveUserTree(res.user.id, starterTree);
    setActiveUser(res.user);
    return res.user;
  }

  throw new Error('Registration failed. Please try again.');
};

export const loginOrRegisterWithGoogle = async ({ name, email, photo, googleId }) => {
  if (!email || !email.includes('@')) {
    throw new Error('A valid Google email address is required.');
  }

  purgeLegacySharedTreeKeys();
  // Clear any previous user's auth token first
  setAuthToken(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isAlexDemo =
    normalizedEmail === 'alex@ancestry.com' ||
    normalizedEmail === 'alex.morgan@gmail.com' ||
    googleId === 'user_alex_morgan' ||
    googleId === 'g_alex_morgan';

  if (isAlexDemo) {
    setActiveUser(DEFAULT_DEMO_USER);
    const existingTree = getUserTree(DEFAULT_DEMO_USER.id);
    if (!existingTree || existingTree.length <= 1) {
      saveUserTree(DEFAULT_DEMO_USER.id, updateGenerations(INITIAL_FAMILY_TREE, 'me'));
    }
    return DEFAULT_DEMO_USER;
  }

  // Authenticate with MongoDB Backend Google Auth
  const res = await authApi.googleAuth({
    email: normalizedEmail,
    name: name?.trim() || email.split('@')[0],
    photo,
    googleId
  });

  if (res?.user) {
    setActiveUser(res.user);
    return res.user;
  }

  throw new Error('Failed to authenticate with Google.');
};

export const logoutUser = () => {
  purgeLegacySharedTreeKeys();
  authApi.logout();
  setActiveUser(null);
};

// Strict per-user tree storage key (never shared across accounts)
export const getUserTreeStorageKey = (userId) => `${ISOLATED_TREE_PREFIX}${userId}`;

export const getUserTree = (userId) => {
  if (!userId) return null;
  const key = getUserTreeStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Verify strict ownership envelope
      if (
        parsed &&
        typeof parsed === 'object' &&
        String(parsed.userId) === String(userId) &&
        Array.isArray(parsed.members) &&
        parsed.members.length > 0
      ) {
        return updateGenerations(parsed.members, 'me');
      }
    }
  } catch (e) {
    console.error('Failed to load isolated user tree', e);
  }

  if (userId === DEFAULT_DEMO_USER.id) {
    return updateGenerations(INITIAL_FAMILY_TREE, 'me');
  }

  return null;
};

export const saveUserTree = (userId, members) => {
  if (!userId || !Array.isArray(members) || members.length === 0) return;
  const key = getUserTreeStorageKey(userId);
  try {
    const payload = {
      userId: String(userId),
      members,
      updatedAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save isolated user tree', e);
  }
};

// Check if tree is just the default demo placeholder
export const isAlexDemoTree = (tree) => {
  if (!Array.isArray(tree) || tree.length === 0) return false;
  return tree.some((m) => m.name === 'Alex Morgan' || m.name === 'Arthur Morgan');
};

// Strict lookup: ONLY ever returns the tree belonging to `user.id`
export const findRealUserTree = (user) => {
  if (!user || !user.id) return null;
  return getUserTree(user.id);
};

// Ensure active JWT token exists and strictly matches `activeUser.id`
export const ensureAuthToken = async (activeUser) => {
  const user = activeUser || getActiveUser();
  if (!user || !user.id || user.id === DEFAULT_DEMO_USER.id) return null;

  const token = getAuthToken();
  if (token) {
    const tokenUserId = decodeJwtUserId(token);
    if (tokenUserId === String(user.id)) {
      return token;
    }
    // Token belongs to a different user — clear it immediately!
    setAuthToken(null);
  }

  // Only auto-handshake for Google-authenticated sessions
  if (user.authProvider === 'google' && user.email) {
    try {
      const res = await authApi.googleAuth({
        email: user.email.toLowerCase().trim(),
        name: user.name || user.email.split('@')[0],
        photo: user.photo,
        googleId: user.googleId || null
      });
      if (res?.token && res?.user && String(res.user.id) === String(user.id)) {
        setAuthToken(res.token);
        return res.token;
      }
    } catch (err) {
      console.warn('Auto-session handshake notice:', err.message);
    }
  }

  return null;
};

// MongoDB Sync Helpers — strictly scoped to the authenticated user
export const syncTreeToBackend = async (members, treeName, activeUser = null) => {
  try {
    const user = activeUser || getActiveUser();
    if (!user || !user.id || user.id === DEFAULT_DEMO_USER.id) {
      return { success: false, error: 'Demo or unauthenticated user' };
    }

    const token = await ensureAuthToken(user);
    if (!token) {
      return { success: false, error: 'Could not obtain verified session token for current user' };
    }

    if (Array.isArray(members) && members.length > 0) {
      const res = await treeApi.saveTree(members, treeName || user.treeName);
      return { success: true, count: members.length, data: res };
    }
    return { success: false, error: 'Tree members array is empty' };
  } catch (err) {
    console.warn('MongoDB sync notice:', err.message);
    return { success: false, error: err.message };
  }
};

export const fetchTreeFromBackend = async (activeUser = null) => {
  try {
    const user = activeUser || getActiveUser();
    if (!user || !user.id || user.id === DEFAULT_DEMO_USER.id) {
      return null;
    }

    const token = await ensureAuthToken(user);
    if (!token) return null;

    const data = await treeApi.getTree();
    // Verify backend response belongs to the active user
    if (data?.userId && String(data.userId) !== String(user.id)) {
      console.error('Security check: Backend tree userId mismatch, ignoring response');
      return null;
    }

    if (data?.members && Array.isArray(data.members) && data.members.length > 0) {
      return {
        userId: data.userId || String(user.id),
        treeName: data.treeName,
        members: updateGenerations(data.members, 'me')
      };
    }
  } catch (err) {
    console.warn('MongoDB tree fetch notice:', err.message);
  }
  return null;
};

export const updateCurrentUserTreeName = async (newName) => {
  if (!newName || !newName.trim()) return null;
  const active = getActiveUser();
  if (!active) return null;
  active.treeName = newName.trim();
  setActiveUser(active);

  try {
    const token = await ensureAuthToken(active);
    if (token) {
      await treeApi.updateTreeName(newName.trim());
    }
  } catch (err) {
    console.warn('Failed to update tree name in MongoDB:', err.message);
  }

  return active;
};
