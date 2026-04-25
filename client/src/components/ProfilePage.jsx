import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .prof-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem; }
  .prof-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--bg-hover); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
  }
  .prof-email { font-size: .8rem; color: var(--text-muted); }
  .prof-pts { font-size: 1.5rem; color: var(--accent); font-family: var(--font-display); }
  .prof-section { margin-bottom: 2.5rem; }
  .prof-section-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1rem; border-bottom: 1px solid var(--border);
    padding-bottom: .5rem;
  }
  .prof-badges { display: flex; flex-wrap: wrap; gap: .75rem; }
  .prof-badge {
    padding: .5rem 1rem; border: 1px solid var(--border); border-radius: 2px;
    font-size: .7rem; color: var(--text); background: var(--bg-card);
  }
  .prof-badge-icon { margin-right: .4rem; }
  .prof-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
  .prof-table th {
    text-align: left; font-size: .6rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-muted); padding: .5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .prof-table td { padding: .6rem 0; border-bottom: 1px solid var(--bg-card); color: var(--text); }
  .prof-status-approved { color: var(--accent); }
  .prof-status-pending  { color: var(--warning); }
  .prof-status-rejected { color: var(--error); }
  .prof-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .prof-table { min-width: 480px; }
  @media (max-width: 500px) {
    .prof-header { gap: 1rem; }
  }
`;

export default function ProfilePage() {
  const { apiFetch } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/users/me/stats')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>Loading…</p>;
  if (!data)   return <p style={{ color: 'var(--error)', fontSize: '.75rem' }}>Failed to load profile.</p>;

  const { user, badges, submissions } = data;

  return (
    <>
      <style>{CSS}</style>
      <div className="prof-header">
        <div className="prof-avatar">👤</div>
        <div>
          <div className="prof-pts">{user.total_points} pts</div>
          <div className="prof-email">{user.email}</div>
        </div>
      </div>

      <div className="prof-section">
        <div className="prof-section-title">Badges</div>
        {badges.length === 0
          ? <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>No badges yet — start submitting to earn points!</p>
          : (
            <div className="prof-badges">
              {badges.map(b => (
                <div key={b.name} className="prof-badge" title={b.description}>
                  <span className="prof-badge-icon">{b.icon}</span>{b.name}
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div className="prof-section">
        <div className="prof-section-title">Your submissions</div>
        {submissions.length === 0
          ? <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>No submissions yet.</p>
          : (
            <div className="prof-table-wrap"><table className="prof-table">
              <thead>
                <tr>
                  <th>Descriptor</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.7rem', color: 'var(--accent)' }}>{s.descriptor}</td>
                    <td>{s.merchant_name}</td>
                    <td className={`prof-status-${s.status}`}>{s.status}</td>
                    <td>{s.upvote_count}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        }
      </div>
    </>
  );
}
