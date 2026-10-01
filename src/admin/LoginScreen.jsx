import { useState } from 'react';
import { logIn } from './auth';

export default function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const out = await logIn(email.trim(), password);
    setBusy(false);
    if (out.ok) onLoggedIn();
    else setError(out.reason);
  };

  return (
    <div className="ad-login">
      <form className="ad-login-card" onSubmit={submit}>
        <p className="ad-eyebrow">Spot the Scam</p>
        <h1 className="ad-login-title">Admin</h1>
        <p className="ad-muted">Run workshops and see the results.</p>

        <label className="ad-label" htmlFor="ad-email">
          Email
        </label>
        <input
          id="ad-email"
          className="ad-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label className="ad-label" htmlFor="ad-password">
          Password
        </label>
        <input
          id="ad-password"
          className="ad-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}

        <button className="ad-btn ad-btn-primary ad-login-btn" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <p className="ad-footnote">
          Logged in for this tab only. Closing it logs you out.
        </p>
      </form>
    </div>
  );
}
