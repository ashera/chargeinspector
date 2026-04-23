import { useEffect, useState } from 'react';

const CSS = `
  .lb-title { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: .5rem; }
  .lb-sub { font-size: .75rem; color: #4b4b4b; margin-bottom: 2rem; }
  .lb-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
  .lb-table th {
    text-align: left; font-size: .6rem; letter-spacing: .12em;
    text-transform: uppercase; color: #4b4b4b; padding: .5rem 0;
    border-bottom: 1px solid #1e1e1e;
  }
  .lb-table td { padding: .75rem 0; border-bottom: 1px solid #111; }
  .lb-rank { color: #4b4b4b; font-size: .7rem; width: 2rem; }
  .lb-rank-1 { color: #ffd700; }
  .lb-rank-2 { color: #c0c0c0; }
  .lb-rank-3 { color: #cd7f32; }
  .lb-email { color: #f0ede6; }
  .lb-pts { color: #6ee7a0; font-weight: 500; }
  .lb-badge { font-size: .75rem; }
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
        ? <p style={{ color: '#4b4b4b', fontSize: '.75rem' }}>Loading…</p>
        : rows.length === 0
          ? <p style={{ color: '#4b4b4b', fontSize: '.75rem' }}>No contributors yet — be the first to submit!</p>
          : (
            <table className="lb-table">
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
                    <td style={{ color: '#4b4b4b' }}>{r.approved_submissions}</td>
                    <td className="lb-badge">{r.top_badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      }
    </>
  );
}
