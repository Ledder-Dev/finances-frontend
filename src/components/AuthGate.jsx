import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';

export function AuthGate() {
  const { authMode, error, toggleAuthMode, submitAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const ok = await submitAuth(email, password);
    if (ok) setPassword('');
  };

  return (
    <div id="authGate" className="auth-gate">
      <div className="card auth-box">
        <h1 className="title" style={{ marginBottom: 2 }}>Finance Tracker</h1>
        <p className="subtitle" style={{ marginBottom: 16 }}>Sign in to your account</p>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary" onClick={handleSubmit}>
          {authMode === 'login' ? 'Log in' : 'Sign up'}
        </button>
        <p className="auth-toggle">
          <span>{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
          <button type="button" className="auth-toggle-link" onClick={toggleAuthMode}>
            {authMode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
