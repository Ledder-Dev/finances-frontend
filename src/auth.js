import { state } from './state.js';
import { apiFetch } from './api.js';
import { loadApp } from './core.js';

export function showAuthGate() {
  document.getElementById('authGate').style.display = 'flex';
  document.querySelector('.container').style.display = 'none';
}

export function hideAuthGate() {
  document.getElementById('authGate').style.display = 'none';
  document.querySelector('.container').style.display = '';
}

export function toggleAuthMode() {
  state.authMode = state.authMode === 'login' ? 'signup' : 'login';
  document.getElementById('authSubmitBtn').textContent = state.authMode === 'login' ? 'Log in' : 'Sign up';
  document.getElementById('authToggleText').textContent = state.authMode === 'login' ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authToggleBtn').textContent = state.authMode === 'login' ? 'Sign up' : 'Log in';
  document.getElementById('authError').style.display = 'none';
}

export async function submitAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  if (!email || !password) {
    errEl.textContent = 'Email and password are required';
    errEl.style.display = 'block';
    return;
  }
  const res = await apiFetch(`/api/auth/${state.authMode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!body.success) {
    errEl.textContent = body.error || 'Something went wrong';
    errEl.style.display = 'block';
    return;
  }
  localStorage.setItem('authToken', body.data.token);
  hideAuthGate();
  await loadApp();
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
  showAuthGate();
}

export async function init() {
  try {
    const res = await apiFetch('/api/auth/me');
    const { data: user } = await res.json();
    if (!user) {
      showAuthGate();
      return;
    }
    hideAuthGate();
    await loadApp();
  } catch (err) {
    console.error('auth.init failed:', err);
    showAuthGate();
  }
}
