import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .nav {
    border-bottom: 1px solid #1e1e1e;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    gap: 0;
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
    font-size: .65rem;
    color: #6ee7a0;
    letter-spacing: .08em;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
    padding: 0;
  }
  .nav-pts:hover { text-decoration: underline; }
  .nav-logout {
    font-size: .6rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #4b4b4b;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
  }
  .nav-logout:hover { color: #e05c5c; }
`;

export default function Nav({ page, navigate, isAuthenticated, user, onPointsClick }) {
  const { logout } = useAuth();

  const links = [
    { key: 'search',      label: 'Search' },
    { key: 'submit',      label: 'Contribute' },
    { key: 'leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ key: 'profile', label: 'Profile' }] : []),
    ...(user?.role === 'admin' ? [{ key: 'admin', label: 'Admin' }] : []),
  ];

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="nav-logo" onClick={() => navigate('search')}>
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
              <span style={{ fontSize: '.65rem', color: '#4b4b4b', letterSpacing: '.06em' }}>{user.email}</span>
            </>
          )}
          {isAuthenticated
            ? <button className="nav-logout" onClick={logout}>Logout</button>
            : <button className="nav-link" onClick={() => navigate('login')}>Login</button>
          }
        </div>
      </nav>
    </>
  );
}
