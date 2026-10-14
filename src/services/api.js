// API Service connecting the Frontend to Express & MongoDB Backend
const RAW_API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;
const TOKEN_KEY = 'ancestry_auth_token_v1';

export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to persist auth token', e);
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Check if MongoDB backend is alive
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};

export const authApi = {
  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  googleAuth: async (googleData) => {
    const res = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  getMe: async () => {
    return await request('/auth/me');
  },

  logout: () => {
    setAuthToken(null);
  }
};

export const treeApi = {
  getTree: async () => {
    return await request('/tree');
  },

  saveTree: async (members, treeName) => {
    return await request('/tree', {
      method: 'PUT',
      body: JSON.stringify({ members, treeName })
    });
  },

  updateTreeName: async (treeName) => {
    return await request('/tree/name', {
      method: 'PATCH',
      body: JSON.stringify({ treeName })
    });
  }
};
