import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getCurrentRank } from '../constants/ranks.js';

const CSS = `
  .nav {
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    font-family: var(--font-ui);
    background: var(--bg-page);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-logo {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--text);
    margin-right: 2rem;
    padding: 1rem 0;
    cursor: pointer;
    white-space: nowrap;
  }
  .nav-logo span { color: var(--accent); }
  .nav-links { display: flex; gap: 0; flex: 1; }
  .nav-link {
    padding: .85rem 1rem;
    font-size: .65rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: var(--font-ui);
    transition: color .2s, border-color .2s;
  }
  .nav-link:hover { color: var(--text); }
  .nav-link.active { color: var(--text); border-bottom-color: var(--accent); }
  .nav-right { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
  .nav-pts {
    font-size: .65rem; color: var(--accent); letter-spacing: .08em;
    cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0;
  }
  .nav-pts:hover { text-decoration: underline; }
  .nav-identity {
    display: flex; flex-direction: column; gap: .1rem;
    cursor: pointer; align-items: flex-end;
  }
  .nav-rank {
    font-size: .65rem; color: var(--text); letter-spacing: .06em; white-space: nowrap;
    transition: color .2s;
  }
  .nav-identity:hover .nav-rank { color: var(--accent); }
  .nav-email { font-size: .6rem; color: var(--text-muted); letter-spacing: .06em; }
  .nav-logout {
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui);
  }
  .nav-logout:hover { color: var(--error); }

  .nav-burger {
    display: none; background: none; border: none;
    cursor: pointer; padding: .6rem .25rem;
    flex-direction: column; gap: 5px;
    flex-shrink: 0; margin-left: .5rem;
  }
  .nav-burger span {
    display: block; width: 20px; height: 2px;
    background: var(--text); transition: background .2s;
  }
  .nav-burger:hover span { background: var(--accent); }

  .nav-drawer {
    position: absolute; top: 100%; left: 0; right: 0;
    background: var(--bg-page); border-bottom: 1px solid var(--border);
  }
  .nav-drawer-item {
    display: block; width: 100%; text-align: left;
    padding: .9rem 1.5rem;
    font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer;
    background: none; border: none; border-bottom: 1px solid var(--bg-card);
    font-family: var(--font-ui); transition: color .2s;
  }
  .nav-drawer-item:hover { color: var(--text); }
  .nav-drawer-item.active { color: var(--accent); }
  .nav-drawer-bottom {
    padding: .9rem 1.5rem; border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .nav-drawer-rank { font-size: .65rem; color: var(--text); letter-spacing: .06em; margin-bottom: .15rem; }
  .nav-drawer-email { font-size: .6rem; color: var(--text-muted); }
  .nav-drawer-logout {
    background: none; border: none; font-family: var(--font-ui);
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer;
  }
  .nav-drawer-logout:hover { color: var(--error); }

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
  const rank = user ? getCurrentRank(user.total_points ?? 0) : null;

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const links = [
    { key: 'search',      label: 'Search' },
    { key: 'submit',      label: 'Contribute' },
    { key: 'leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ key: 'profile', label: 'Profile' }] : []),
    ...(user?.role === 'admin' ? [
      { key: 'admin',        label: 'Admin' },
      { key: 'case-archive', label: 'Cases' },
    ] : []),
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
              <div className="nav-identity" onClick={() => { navigate('profile'); setOpen(false); }}>
                <span className="nav-rank">
                  {rank.icon} {rank.name}{user.last_name ? ` ${user.last_name}` : ''}
                </span>
                <span className="nav-email">{user.email}</span>
              </div>
              <button className="nav-pts" onClick={onPointsClick}>{user.total_points ?? 0} pts</button>
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
                <div>
                  <div className="nav-drawer-rank">{rank.icon} {rank.name}{user.last_name ? ` ${user.last_name}` : ''}</div>
                  <span className="nav-drawer-email">{user.email}</span>
                </div>
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
