export const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? `http://${window.location.hostname}:${import.meta.env.VITE_API_PORT ?? '3001'}`;

const _fetch = window.fetch;

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function apiFetch(url, options = {}) {
  const fullUrl = typeof url === 'string' && url.startsWith('/api/') ? API_BASE + url : url;
  return _fetch(fullUrl, { ...options, credentials: 'include' });
}

window.fetch = async (...args) => {
  const res = await apiFetch(...args);
  if (res.status === 401) onUnauthorized();
  return res;
};
