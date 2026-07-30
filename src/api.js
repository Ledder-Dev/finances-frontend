import { showAuthGate } from './auth.js';

export const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : `http://${window.location.hostname}:3001`);

export function authToken() {
  return localStorage.getItem('authToken');
}

const _fetch = window.fetch;

export function apiFetch(url, options = {}) {
  const fullUrl = typeof url === 'string' && url.startsWith('/api/') ? API_BASE + url : url;
  const token = authToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return _fetch(fullUrl, { ...options, headers });
}

window.fetch = async (...args) => {
  const res = await apiFetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    showAuthGate();
  }
  return res;
};
