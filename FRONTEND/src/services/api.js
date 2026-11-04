import CONFIG from '../config/index.js';

/**
 * SMART ROUTE — Centralized API Client Layer
 * Handles JWT token injection, response serialization, and 401 refresh flows.
 */

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !options._retry) {
      // Try refresh token if available
      const refreshToken = localStorage.getItem('smartroute_refresh_token') || localStorage.getItem('sr_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.accessToken || refreshData.tokens?.accessToken || refreshData.token || refreshData.data?.accessToken;
          if (refreshData.success && newAccessToken) {
            localStorage.setItem('smartroute_token', newAccessToken);
            localStorage.setItem('sr_access_token', newAccessToken);
            if (refreshData.refreshToken) {
              localStorage.setItem('smartroute_refresh_token', refreshData.refreshToken);
              localStorage.setItem('sr_refresh_token', refreshData.refreshToken);
            }
            if (refreshData.user) {
              localStorage.setItem('smartroute_user', JSON.stringify(refreshData.user));
              localStorage.setItem('sr_user', JSON.stringify(refreshData.user));
            }
            return request(endpoint, { ...options, _retry: true });
          }
        } catch (e) {
          // Token renewal failed - do not aggressively wipe persistent storage
        }
      }
    }
    const errMsg = (Array.isArray(data.details) && data.details.length > 0)
      ? data.details.map((d) => d.message).join('. ')
      : (data.error || `HTTP ${response.status}`);
    const err = new Error(errMsg);
    err.status = response.status;
    err.code = data.code;
    err.details = data.details;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
