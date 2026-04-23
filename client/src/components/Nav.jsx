import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .nav {
    border-bottom: 1px solid #1e1e1e;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    font-family: 'DM Mono', monospace;
    background: #0a0a0a;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1rem;
    color: #f0ede6;
    margin-right: 2rem;
    padding: 1rem 0;
    cursor: pointer;
    white-space: nowrap;
  }
  .nav-logo span { color: #6ee7a0; }
  .nav-links { display: flex; gap: 0; flex: 1; }
  .nav-link {
    padding: .85rem 1rem;
    font-size: .65rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #4b4b4b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: 'DM Mono', monospace;
    transition: color .2s, border-color .2s;
  }
  .nav-link:hover { color: #f0ede6; }
  .nav-link.active { color: #f0ede6; border-bottom-color: #6ee7a0; }
  .nav-right { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
  .nav-pts {
    font-size: .65rem; color: #6ee7a0; letter-spacing: .08em;
    cursor: pointer; background: none; border: none;
    font-family: 'DM Mono', monospace; padding: 0;
  }
  .nav-pts:hover { text-decoration: underline; }
  .nav-email { font-size: .65rem; color: #4b4b4b; letter-spacing: .06em; }
  .nav-logout {
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer; background: none; border: none;
    font-family: 'DM Mono', monospace;
  }
  .nav-logout:hover { color: #e05c5c; }

  .nav-burger {
    display: none; background: none; border: none;
    cursor: pointer; padding: .6rem .25rem;
    flex-direction: column; gap: 5px;
    flex-shrink: 0; margin-left: .5rem;
  }
  .nav-burger span {
    display: block; width: 20px; height: 2px;
    background: #f0ede6; transition: background .2s;
  }
  .nav-burger:hover span { background: #6ee7a0; }

  .nav-drawer {
    position: absolute; top: 100%; left: 0; right: 0;
    background: #0a0a0a; border-bottom: 1px solid #1e1e1e;
  }
  .nav-drawer-item {
    display: block; width: 100%; text-align: left;
    padding: .9rem 1.5rem;
    font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer;
    background: none; border: none; border-bottom: 1px solid #111;
    font-family: 'DM Mono', monospace; transition: color .2s;
  }
  .nav-drawer-item:hover { color: #f0ede6; }
  .nav-drawer-item.active { color: #6ee7a0; }
  .nav-drawer-bottom {
    padding: .9rem 1.5rem; border-top: 1px solid #1e1e1e;
    display: flex; justify-content: space-between; align-items: center;
  }
  .nav-drawer-email { font-size: .65rem; color: #4b4b4b; }
  .nav-drawer-logout {
    background: none; border: none; font-family: 'DM Mono', monospace;
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer;
  }
  .nav-drawer-logout:hover { color: #e05c5c; }

  @media (max-width: 640px) {
    .nav { padding: 0 1rem; }
    .nav-logo { margin-right: 0; }
    .nav-links { display: none; }
    .nav-email { display: none; }
    .nav-logout { display: none; }
    .nav-burger { display: flex; }
  }
`;

export default function Nav({ page, navigate, isAuthenticated, user, onPointsClick }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { key: 'search',      label: 'Search' },
    { key: 'submit',      label: 'Contribute' },
    { key: 'leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ key: 'profile', label: 'Profile' }] : []),
    ...(user?.role === 'admin' ? [{ key: 'admin', label: 'Admin' }] : []),
  ];

  const go = (key) => { navigate(key); setOpen(false); };

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="nav-logo" onClick={() => go('search')}>
          charge<span>inspector</span>
        </div>

        <div className="nav-links">
          {links.map(l => (
            <button
              key={l.key}
              className={`nav-link ${page === l.key ? 'active' : ''}`}
              onClick={() => navigate(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="nav-right">
          {isAuthenticated && user && (
            <>
              <button className="nav-pts" onClick={onPointsClick}>{user.total_points ?? 0} pts</button>
              <span className="nav-email">{user.email}</span>
            </>
          )}
          {isAuthenticated
            ? <button className="nav-logout" onClick={logout}>Logout</button>
            : <button className="nav-link" onClick={() => navigate('login')}>Login</button>
          }
          <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>

        {open && (
          <div className="nav-drawer">
            {links.map(l => (
              <button
                key={l.key}
                className={`nav-drawer-item ${page === l.key ? 'active' : ''}`}
                onClick={() => go(l.key)}
              >
                {l.label}
              </button>
            ))}
            {!isAuthenticated && (
              <button className="nav-drawer-item" onClick={() => go('login')}>Login</button>
            )}
            {isAuthenticated && user && (
              <div className="nav-drawer-bottom">
                <span className="nav-drawer-email">{user.email}</span>
                <button className="nav-drawer-logout" onClick={() => { logout(); setOpen(false); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
