const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : '';
const API_BASE = `${BASE_URL}/api`;

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    logout: () => request('/auth/logout', {
      method: 'POST'
    }),
    getMe: () => request('/auth/me')
  },

  // Dashboard Metrics
  dashboard: {
    getStats: () => request('/dashboard/stats')
  },

  // Disasters
  disasters: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/disasters${qs}`);
    },
    get: (id) => request(`/disasters/${id}`),
    create: (disasterData) => request('/disasters', {
      method: 'POST',
      body: JSON.stringify(disasterData)
    }),
    updateStatus: (id, status) => request(`/disasters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  // Emergency Requests
  emergency: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/emergency-requests${qs}`);
    },
    create: (requestData) => request('/emergency-requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    }),
    updateStatus: (id, status) => request(`/emergency-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    assignTeam: (id, rescue_team_id) => request(`/emergency-requests/${id}/assign-team`, {
      method: 'PATCH',
      body: JSON.stringify({ rescue_team_id })
    })
  },

  // Rescue Teams
  rescueTeams: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/rescue-teams${qs}`);
    }
  },

  // Shelters
  shelters: {
    list: () => request('/shelters')
  }
};
