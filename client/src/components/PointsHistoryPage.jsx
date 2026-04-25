import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .ph-title { font-family: var(--font-display); font-size: 2rem; margin-bottom: .5rem; }
  .ph-sub   { font-size: .75rem; color: var(--text-muted); margin-bottom: 2rem; }
  .ph-empty { font-size: .75rem; color: var(--text-muted); padding: 3rem 0; text-align: center; }
  .ph-table { width: 100%; border-collapse: collapse; }
  .ph-table th {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); text-align: left; padding: .6rem 1rem;
    border-bottom: 1px solid var(--border); font-weight: 400;
  }
  .ph-table td {
    padding: .9rem 1rem; border-bottom: 1px solid var(--bg-card);
    font-size: .78rem; vertical-align: middle;
  }
  .ph-table tr:last-child td { border-bottom: none; }
  .ph-amount { font-family: var(--font-ui); color: var(--accent); font-size: .85rem; }
  .ph-descriptor {
    font-family: var(--font-ui); font-size: .65rem;
    letter-spacing: .1em; color: var(--accent);
  }
  .ph-merchant { font-weight: 400; }
  .ph-reason {
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); white-space: nowrap;
  }
  .ph-date { font-size: .65rem; color: var(--text-dim); white-space: nowrap; }
  .ph-total {
    display: flex; justify-content: flex-end; align-items: baseline;
    gap: .5rem; margin-bottom: 1.5rem;
  }
  .ph-total-label { font-size: .65rem; color: var(--text-muted); letter-spacing: .1em; text-transform: uppercase; }
  .ph-total-value { font-family: var(--font-display); font-size: 1.75rem; color: var(--accent); }
  .ph-badge {
    display: flex; align-items: center; gap: 1rem;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; margin-bottom: 2rem;
  }
  .ph-badge-icon { font-size: 2rem; flex-shrink: 0; }
  .ph-badge-label { font-size: .55rem; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); margin-bottom: .2rem; }
  .ph-badge-name { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: .15rem; }
  .ph-badge-desc { font-size: .7rem; color: var(--text-muted); }
  .ph-badge-date { font-size: .65rem; color: var(--text-dim); margin-left: auto; white-space: nowrap; align-self: flex-start; }
  .ph-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .ph-table { min-width: 460px; }
  @media (max-width: 500px) {
    .ph-badge { flex-wrap: wrap; }
    .ph-badge-date { margin-left: 0; }
  }
`;

const REASON_LABEL = {
  submission_approved: 'Submission approved',
  upvote_received:     'Upvote received',
};

export default function PointsHistoryPage({ totalPoints }) {
  const { apiFetch }              = useAuth();
  const [rows, setRows]           = useState([]);
  const [latestBadge, setLatestBadge] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    apiFetch('/api/users/me/points')
      .then(r => r.json())
      .then(d => { setRows(d.points || []); setLatestBadge(d.latestBadge ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <h1 className="ph-title">Points history</h1>

      <div className="ph-total">
        <span className="ph-total-label">Total</span>
        <span className="ph-total-value">{totalPoints ?? 0} pts</span>
      </div>

      {!loading && latestBadge && (
        <div className="ph-badge">
          <div className="ph-badge-icon">{latestBadge.icon}</div>
          <div>
            <div className="ph-badge-label">Most recent badge</div>
            <div className="ph-badge-name">{latestBadge.name}</div>
            <div className="ph-badge-desc">{latestBadge.description}</div>
          </div>
          <div className="ph-badge-date">{new Date(latestBadge.awarded_at).toLocaleDateString()}</div>
        </div>
      )}

      {loading && <p className="ph-empty">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="ph-empty">No points earned yet — start by submitting a descriptor match.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="ph-table-wrap"><table className="ph-table">
          <thead>
            <tr>
              <th>Descriptor / Merchant</th>
              <th>Reason</th>
              <th style={{ textAlign: 'right' }}>Points</th>
              <th style={{ textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="ph-descriptor">{r.descriptor}</div>
                  <div className="ph-merchant">{r.merchant_name}</div>
                </td>
                <td><span className="ph-reason">{REASON_LABEL[r.reason] ?? r.reason}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <span className="ph-amount">+{r.amount}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="ph-date">{new Date(r.created_at).toLocaleDateString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
