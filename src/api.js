import { showAuthGate } from './auth.js';

export const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? `http://${window.location.hostname}:${import.meta.env.VITE_API_PORT ?? '3001'}`;

export function authToken() {
  return localStorage.getItem('authToken');
}

const _fetch = window.fetch;

export function apiFetch(url, options = {}) {
  const fullUrl = typeof url === 'string' && url.startsWith('/api/') ? API_BASE + url : url;
  const headers = { ...(options.headers || {}) };
  return _fetch(fullUrl, { ...options, headers, credentials: 'include' });
}

window.fetch = async (...args) => {
  const res = await apiFetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    showAuthGate();
  }
  return res;
};
