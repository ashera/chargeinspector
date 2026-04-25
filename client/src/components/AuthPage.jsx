// components/AuthPage.jsx
// ------------------------------------------------------------
// Login / Register UI — clean editorial aesthetic
// Uses useAuth() hook; no props required.
// ------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// ── Styles (scoped via a style tag) ──────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ap-root {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Mono', monospace;
    background: #0a0a0a;
    color: #f0ede6;
  }

  @media (max-width: 720px) {
    .ap-root { grid-template-columns: 1fr; }
    .ap-brand { display: none; }
  }

  /* ── Brand Panel ── */
  .ap-brand {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 3rem;
    overflow: hidden;
    border-right: 1px solid #1e1e1e;
  }

  .ap-brand-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 30% 60%, #1a3a2a 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 70% 20%, #0f1f3a 0%, transparent 65%),
      #0a0a0a;
  }

  .ap-brand-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .ap-brand-content {
    position: relative;
    z-index: 1;
  }

  .ap-brand-eyebrow {
    font-size: .65rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #6ee7a0;
    margin-bottom: 1rem;
    opacity: .8;
  }

  .ap-brand-headline {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2.5rem, 4vw, 3.75rem);
    line-height: 1.08;
    color: #f0ede6;
    margin-bottom: 1.5rem;
  }

  .ap-brand-headline em {
    font-style: italic;
    color: #6ee7a0;
  }

  .ap-brand-body {
    font-size: .75rem;
    line-height: 1.7;
    color: #6b6b6b;
    max-width: 28ch;
  }

  .ap-pills {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-top: 2.5rem;
  }

  .ap-pill {
    padding: .3rem .75rem;
    border: 1px solid #1e1e1e;
    border-radius: 2px;
    font-size: .6rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #888;
  }

  /* ── Form Panel ── */
  .ap-form-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
  }

  .ap-card {
    width: 100%;
    max-width: 380px;
  }

  .ap-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1.1rem;
    letter-spacing: .02em;
    margin-bottom: 2.5rem;
    color: #f0ede6;
  }

  .ap-logo span { color: #6ee7a0; }

  /* Tab toggle */
  .ap-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 2rem;
    border-bottom: 1px solid #1e1e1e;
  }

  .ap-tab {
    flex: 1;
    padding: .65rem 1rem;
    font-family: 'DM Mono', monospace;
    font-size: .7rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #888;
    cursor: pointer;
    transition: color .2s, border-color .2s;
    margin-bottom: -1px;
  }

  .ap-tab.active {
    color: #f0ede6;
    border-bottom-color: #6ee7a0;
  }

  /* Fields */
  .ap-field {
    margin-bottom: 1.25rem;
  }

  .ap-label {
    display: block;
    font-size: .6rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: .5rem;
  }

  .ap-input {
    width: 100%;
    padding: .75rem 1rem;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 2px;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    font-size: .8rem;
    transition: border-color .2s;
    outline: none;
  }

  .ap-input:focus { border-color: #6ee7a0; }
  .ap-input::placeholder { color: #4b4b4b; }

  .ap-input.error { border-color: #e05c5c; }

  /* Strength bar */
  .ap-strength {
    height: 2px;
    background: #1e1e1e;
    margin-top: .4rem;
    border-radius: 2px;
    overflow: hidden;
  }

  .ap-strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width .3s, background .3s;
  }

  /* Submit */
  .ap-submit {
    width: 100%;
    padding: .85rem;
    margin-top: .5rem;
    background: #6ee7a0;
    border: none;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: .7rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #0a0a0a;
    font-weight: 500;
    cursor: pointer;
    transition: opacity .2s, transform .1s;
  }

  .ap-submit:hover:not(:disabled) { opacity: .88; }
  .ap-submit:active:not(:disabled) { transform: translateY(1px); }
  .ap-submit:disabled { opacity: .4; cursor: not-allowed; }

  /* Error / status */
  .ap-error {
    font-size: .7rem;
    color: #e05c5c;
    margin-top: 1rem;
    line-height: 1.5;
    min-height: 1.2rem;
  }

  .ap-footer {
    margin-top: 2rem;
    font-size: .6rem;
    color: #4b4b4b;
    line-height: 1.6;
    letter-spacing: .04em;
  }

  .ap-footer a {
    color: #888;
    text-decoration: underline;
    cursor: pointer;
  }

  /* Spinner */
  @keyframes ap-spin { to { transform: rotate(360deg); } }
  .ap-spinner {
    display: inline-block;
    width: .85em;
    height: .85em;
    border: 2px solid rgba(10,10,10,.3);
    border-top-color: #0a0a0a;
    border-radius: 50%;
    animation: ap-spin .6s linear infinite;
    vertical-align: middle;
    margin-right: .4em;
  }
`;

// ── Password strength ─────────────────────────────────────────
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;

  const levels = [
    { label: 'Very weak', color: '#e05c5c' },
    { label: 'Weak',      color: '#e07a5c' },
    { label: 'Fair',      color: '#e0c05c' },
    { label: 'Good',      color: '#8ce05c' },
    { label: 'Strong',    color: '#6ee7a0' },
    { label: 'Strong',    color: '#6ee7a0' },
  ];
  return { score: s, ...levels[s] };
}

// ── Component ─────────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  const { login, register } = useAuth();

  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  const emailRef = useRef(null);

  // Focus email on tab switch
  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  const strength = mode === 'register' ? passwordStrength(password) : null;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (busy) return;
    setError('');

    if (!email.trim())    return setError('Email is required.');
    if (!password)        return setError('Password is required.');
    if (mode === 'register' && password.length < 8)
      return setError('Password must be at least 8 characters.');

    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      onAuth?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ap-root">

        {/* ── Brand panel ── */}
        <div className="ap-brand">
          <div className="ap-brand-bg" />
          <div className="ap-brand-grid" />
          <div className="ap-brand-content">
            <p className="ap-brand-eyebrow">Secure by design</p>
            <h1 className="ap-brand-headline">
              Auth that<br /><em>doesn't</em><br />compromise.
            </h1>
            <p className="ap-brand-body">
              JWT access tokens in memory. Refresh tokens in httpOnly cookies.
              Rotation, reuse detection, and bcrypt-hashed storage — all without
              a third-party auth service.
            </p>
            <div className="ap-pills">
              {['XSS-resistant','CSRF-safe','Reuse detection','Token rotation','Role-based access'].map(p => (
                <span key={p} className="ap-pill">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="ap-form-panel">
          <div className="ap-card">
            <div className="ap-logo">auth<span>.</span>js</div>

            <div className="ap-tabs" role="tablist">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  className={`ap-tab ${mode === m ? 'active' : ''}`}
                  onClick={() => switchMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="ap-field">
              <label className="ap-label" htmlFor="ap-email">Email</label>
              <input
                id="ap-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                className={`ap-input ${error && !email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={busy}
              />
            </div>

            <div className="ap-field">
              <label className="ap-label" htmlFor="ap-password">Password</label>
              <input
                id="ap-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="ap-input"
                placeholder={mode === 'register' ? 'min. 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={busy}
              />
              {mode === 'register' && password && (
                <div className="ap-strength" title={strength.label}>
                  <div
                    className="ap-strength-fill"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      background: strength.color,
                    }}
                  />
                </div>
              )}
            </div>

            <button
              className="ap-submit"
              onClick={handleSubmit}
              disabled={busy}
            >
              {busy && <span className="ap-spinner" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <p className="ap-error" role="alert">{error}</p>

            <p className="ap-footer">
              {mode === 'login'
                ? <>No account? <a onClick={() => switchMode('register')}>Register</a>.</>
                : <>Already have an account? <a onClick={() => switchMode('login')}>Sign in</a>.</>
              }
              <br />
              Access tokens are never written to disk or localStorage.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
