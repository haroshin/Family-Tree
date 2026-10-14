// Authentication and Multi-User Tree Storage Manager (MongoDB + LocalStorage Fallback)
import { INITIAL_FAMILY_TREE, JUST_ME_TEMPLATE } from '../data/initialData';
import { updateGenerations } from './treeUtils';
import { getDefaultAvatar } from '../data/avatars';
import { authApi, treeApi, getAuthToken, setAuthToken } from '../services/api';

const USERS_KEY = 'ancestry_registered_users_v1';
const ACTIVE_USER_KEY = 'ancestry_active_session_v1';

// Seed default demo user
export const DEFAULT_DEMO_USER = {
  id: 'user_alex_morgan',
  name: 'Alex Morgan',
  email: 'alex@ancestry.com',
  password: 'password123',
  gender: 'male',
  photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  treeName: 'The Morgan Heritage Tree',
  createdAt: '2026-01-01'
};

export const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }
  // Initialize with demo user if empty
  const initial = [DEFAULT_DEMO_USER];
  localStorage.setItem(USERS_KEY, JSON.stringify(initial));
  return initial;
};

export const saveStoredUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
};

export const getActiveUser = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load active session', e);
  }
  return null;
};

export const setActiveUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to update active session', e);
  }
};

export const loginUser = async (email, password) => {
  // 1. Attempt MongoDB Backend Auth
  try {
    const res = await authApi.login(email, password);
    if (res?.user) {
      setActiveUser(res.user);
      return res.user;
    }
  } catch (apiErr) {
    // If backend returned an explicit 400/401 error, propagate it
    if (apiErr.message && !apiErr.message.includes('Failed to fetch')) {
      throw apiErr;
    }
    console.warn('Backend unavailable, falling back to local credentials:', apiErr.message);
  }

  // 2. Fallback to LocalStorage (for offline / demo users)
  const users = getStoredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );

  if (!found) {
    throw new Error('Invalid email or password. Please try again.');
  }

  setActiveUser(found);
  return found;
};

export const registerUser = async ({ name, email, password, gender = 'male', birthYear = '', treeName = '', photo = null }) => {
  if (!name.trim()) throw new Error('Please enter your full name.');
  if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');

  const resolvedPhoto = photo || getDefaultAvatar(gender);
  const resolvedTreeName = treeName?.trim() || `${name.trim()}'s Family Tree`;

  // 1. Attempt MongoDB Backend Registration
  try {
    const res = await authApi.register({
      name: name.trim(),
      email: email.trim(),
      password,
      gender,
      birthYear,
      treeName: resolvedTreeName,
      photo: resolvedPhoto
    });
    if (res?.user) {
      setActiveUser(res.user);
      return res.user;
    }
  } catch (apiErr) {
    if (apiErr.message && !apiErr.message.includes('Failed to fetch')) {
      throw apiErr;
    }
    console.warn('Backend unavailable, falling back to local register:', apiErr.message);
  }

  // 2. Fallback to LocalStorage
  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const userId = `user_${Date.now()}`;
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim(),
    password,
    gender,
    photo: resolvedPhoto,
    treeName: resolvedTreeName,
    birthYear: birthYear || new Date().getFullYear() - 25 + '',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStoredUsers(users);

  // Initialize personalized starter tree with this user as root "Me"
  const personalizedTree = [
    {
      ...JUST_ME_TEMPLATE[0],
      id: 'me',
      name: newUser.name,
      gender: newUser.gender,
      photo: newUser.photo,
      birthYear: newUser.birthYear,
      relationToMe: 'Me (Progenitor)'
    }
  ];

  saveUserTree(newUser.id, updateGenerations(personalizedTree, 'me'));
  setActiveUser(newUser);

  return newUser;
};

export const loginOrRegisterWithGoogle = async ({ name, email, photo, googleId, loadDemoTree = false }) => {
  if (!email || !email.includes('@')) {
    throw new Error('A valid Google email address is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAlexDemo = normalizedEmail === 'alex@ancestry.com' || 
                     normalizedEmail === 'alex.morgan@gmail.com' || 
                     googleId === 'user_alex_morgan' ||
                     googleId === 'g_alex_morgan';

  // 1. Attempt MongoDB Backend Google Auth
  try {
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
  } catch (apiErr) {
    console.warn('Backend Google auth unavailable, falling back to local:', apiErr.message);
  }

  // 2. Fallback to LocalStorage
  const users = getStoredUsers();
  let user = users.find((u) => u.email.toLowerCase() === normalizedEmail || (isAlexDemo && u.id === DEFAULT_DEMO_USER.id));

  if (user) {
    user.authProvider = 'google';
    if (photo && (!user.photo || user.photo.includes('unsplash') === false)) {
      user.photo = photo;
    }
    saveStoredUsers(users);

    if (user.id === DEFAULT_DEMO_USER.id) {
      const existingTree = getUserTree(user.id);
      if (!existingTree || existingTree.length <= 1) {
        saveUserTree(user.id, updateGenerations(INITIAL_FAMILY_TREE, 'me'));
      }
    }
  } else {
    const userId = isAlexDemo ? DEFAULT_DEMO_USER.id : (googleId ? `google_${googleId}` : `user_g_${Date.now()}`);
    user = {
      id: userId,
      name: name?.trim() || email.split('@')[0],
      email: normalizedEmail,
      password: null,
      authProvider: 'google',
      gender: isAlexDemo ? 'male' : 'other',
      photo: photo || (isAlexDemo ? DEFAULT_DEMO_USER.photo : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`),
      treeName: isAlexDemo ? 'The Morgan Heritage Tree' : `${(name || email.split('@')[0]).trim()}'s Family Tree`,
      birthYear: isAlexDemo ? '1998' : new Date().getFullYear() - 25 + '',
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveStoredUsers(users);

    if (loadDemoTree || isAlexDemo) {
      const demoTree = updateGenerations(INITIAL_FAMILY_TREE, 'me').map(m => {
        if (m.id === 'me') {
          return {
            ...m,
            name: user.name,
            photo: user.photo,
            gender: user.gender
          };
        }
        return m;
      });
      saveUserTree(user.id, demoTree);
    } else {
      const personalizedTree = [
        {
          ...JUST_ME_TEMPLATE[0],
          id: 'me',
          name: user.name,
          gender: user.gender,
          photo: user.photo,
          birthYear: user.birthYear,
          relationToMe: 'Me (Progenitor)'
        }
      ];
      saveUserTree(user.id, updateGenerations(personalizedTree, 'me'));
    }
  }

  setActiveUser(user);
  return user;
};

export const logoutUser = () => {
  authApi.logout();
  setActiveUser(null);
};

// Tree storage per user (LocalStorage Cache)
export const getUserTreeStorageKey = (userId) => `ancestry_tree_user_${userId}`;

export const getUserTree = (userId) => {
  if (!userId) return null;
  const key = getUserTreeStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return updateGenerations(parsed, 'me');
      }
    }
  } catch (e) {
    console.error('Failed to load user tree', e);
  }

  // If this is the demo user, fallback to INITIAL_FAMILY_TREE
  if (userId === DEFAULT_DEMO_USER.id) {
    return updateGenerations(INITIAL_FAMILY_TREE, 'me');
  }

  return null;
};

export const saveUserTree = (userId, members) => {
  if (!userId || !Array.isArray(members)) return;
  const key = getUserTreeStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save user tree', e);
  }
};

// MongoDB Sync Helpers
export const syncTreeToBackend = async (members, treeName) => {
  try {
    if (getAuthToken()) {
      await treeApi.saveTree(members, treeName);
    }
  } catch (err) {
    console.warn('MongoDB sync notice:', err.message);
  }
};

export const fetchTreeFromBackend = async () => {
  try {
    if (getAuthToken()) {
      const data = await treeApi.getTree();
      if (data?.members && Array.isArray(data.members) && data.members.length > 0) {
        return {
          treeName: data.treeName,
          members: updateGenerations(data.members, 'me')
        };
      }
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

  // Sync to MongoDB if logged in with token
  try {
    if (getAuthToken()) {
      await treeApi.updateTreeName(newName.trim());
    }
  } catch (err) {
    console.warn('Failed to update tree name in MongoDB:', err.message);
  }

  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === active.id);
  if (idx >= 0) {
    users[idx].treeName = active.treeName;
    saveStoredUsers(users);
  }
  return active;
};
