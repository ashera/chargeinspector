import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .prof-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem; }
  .prof-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: #1a1a1a; border: 1px solid #1e1e1e;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
  }
  .prof-email { font-size: .8rem; color: #888; }
  .prof-pts { font-size: 1.5rem; color: #6ee7a0; font-family: 'DM Serif Display', serif; }
  .prof-section { margin-bottom: 2.5rem; }
  .prof-section-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
    color: #888; margin-bottom: 1rem; border-bottom: 1px solid #1e1e1e;
    padding-bottom: .5rem;
  }
  .prof-badges { display: flex; flex-wrap: wrap; gap: .75rem; }
  .prof-badge {
    padding: .5rem 1rem; border: 1px solid #1e1e1e; border-radius: 2px;
    font-size: .7rem; color: #f0ede6; background: #111;
  }
  .prof-badge-icon { margin-right: .4rem; }
  .prof-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
  .prof-table th {
    text-align: left; font-size: .6rem; letter-spacing: .12em;
    text-transform: uppercase; color: #888; padding: .5rem 0;
    border-bottom: 1px solid #1e1e1e;
  }
  .prof-table td { padding: .6rem 0; border-bottom: 1px solid #111; color: #f0ede6; }
  .prof-status-approved { color: #6ee7a0; }
  .prof-status-pending  { color: #e0c05c; }
  .prof-status-rejected { color: #e05c5c; }
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

  if (loading) return <p style={{ color: '#4b4b4b', fontSize: '.75rem' }}>Loading…</p>;
  if (!data)   return <p style={{ color: '#e05c5c', fontSize: '.75rem' }}>Failed to load profile.</p>;

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
          ? <p style={{ fontSize: '.75rem', color: '#4b4b4b' }}>No badges yet — start submitting to earn points!</p>
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
          ? <p style={{ fontSize: '.75rem', color: '#4b4b4b' }}>No submissions yet.</p>
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
                    <td style={{ fontFamily: 'monospace', fontSize: '.7rem', color: '#6ee7a0' }}>{s.descriptor}</td>
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
