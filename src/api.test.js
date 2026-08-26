import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API_BASE resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('falls back to the localhost heuristic when VITE_API_BASE_URL is unset', async () => {
    vi.stubEnv('VITE_API_PORT', '3001');
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

  it('sends credentials so the session cookie travels with the request', async () => {
    vi.stubEnv('VITE_API_PORT', '3001');
    const { apiFetch } = await import('./api.js');
    await apiFetch('/api/purchases');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/api/purchases');
    expect(options.credentials).toBe('include');
  });

  it('leaves non-/api/ URLs untouched', async () => {
    const { apiFetch } = await import('./api.js');
    await apiFetch('https://cdn.example.com/thing.json');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://cdn.example.com/thing.json');
  });
});
