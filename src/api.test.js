import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API_BASE resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('falls back to the localhost heuristic when VITE_API_BASE_URL is unset', async () => {
    const { API_BASE } = await import('./api.js');
    expect(API_BASE).toBe('http://localhost:3001');
  });

  it('uses VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    const { API_BASE } = await import('./api.js');
    expect(API_BASE).toBe('https://api.example.com');
  });
});

describe('apiFetch', () => {
  let fetchMock;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('injects the Authorization header when a token is stored', async () => {
    localStorage.setItem('authToken', 'abc123');
    const { apiFetch } = await import('./api.js');
    await apiFetch('/api/purchases');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/api/purchases');
    expect(options.headers['Authorization']).toBe('Bearer abc123');
  });

  it('omits the Authorization header when there is no token', async () => {
    const { apiFetch } = await import('./api.js');
    await apiFetch('/api/purchases');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('leaves non-/api/ URLs untouched', async () => {
    const { apiFetch } = await import('./api.js');
    await apiFetch('https://cdn.example.com/thing.json');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://cdn.example.com/thing.json');
  });
});
