import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | anon
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      const { data } = await res.json();
      setUser(data ?? null);
      setStatus(data ? 'authed' : 'anon');
    } catch {
      setUser(null);
      setStatus('anon');
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('anon');
    });
    refresh();
  }, [refresh]);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
  }, []);

  const submitAuth = useCallback(async (email, password) => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    const res = await apiFetch(`/api/auth/${authMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.error || 'Something went wrong');
      return false;
    }
    setError('');
    await refresh();
    return true;
  }, [authMode, refresh]);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setStatus('anon');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, authMode, error, toggleAuthMode, submitAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
