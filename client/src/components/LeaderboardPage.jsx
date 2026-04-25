import { useEffect, useState } from 'react';

const CSS = `
  .lb-title { font-family: var(--font-display); font-size: 2rem; margin-bottom: .5rem; }
  .lb-sub { font-size: .75rem; color: var(--text-muted); margin-bottom: 2rem; }
  .lb-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
  .lb-table th {
    text-align: left; font-size: .6rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-muted); padding: .5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .lb-table td { padding: .75rem 0; border-bottom: 1px solid var(--bg-card); }
  .lb-rank { color: var(--text-muted); font-size: .7rem; width: 2rem; }
  .lb-rank-1 { color: #ffd700; }
  .lb-rank-2 { color: #c0c0c0; }
  .lb-rank-3 { color: #cd7f32; }
  .lb-email { color: var(--text); }
  .lb-pts { color: var(--accent); font-weight: 500; }
  .lb-badge { font-size: .75rem; }
  .lb-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .lb-table { min-width: 400px; }
`;

export default function LeaderboardPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/leaderboard')
      .then(r => r.json())
      .then(d => setRows(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  const rankSymbol = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <>
      <style>{CSS}</style>
      <h1 className="lb-title">Leaderboard</h1>
      <p className="lb-sub">Top contributors ranked by points earned.</p>

      {loading
        ? <p style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>Loading…</p>
        : rows.length === 0
          ? <p style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>No contributors yet — be the first to submit!</p>
          : (
            <div className="lb-table-wrap"><table className="lb-table">
              <thead>
                <tr>
                  <th></th>
                  <th>User</th>
                  <th>Points</th>
                  <th>Approved</th>
                  <th>Badge</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className={`lb-rank ${i < 3 ? `lb-rank-${i + 1}` : ''}`}>{rankSymbol(i)}</td>
                    <td className="lb-email">{r.email.replace(/(.{2}).*(@.*)/, '$1***$2')}</td>
                    <td className="lb-pts">{r.total_points}</td>
                    <td style={{ color: 'var(--text-dim)' }}>{r.approved_submissions}</td>
                    <td className="lb-badge">{r.top_badge}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
      }
    </>
  );
}
