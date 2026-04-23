import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .ph-title { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: .5rem; }
  .ph-sub   { font-size: .75rem; color: #4b4b4b; margin-bottom: 2rem; }
  .ph-empty { font-size: .75rem; color: #4b4b4b; padding: 3rem 0; text-align: center; }
  .ph-table { width: 100%; border-collapse: collapse; }
  .ph-table th {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; text-align: left; padding: .6rem 1rem;
    border-bottom: 1px solid #1e1e1e; font-weight: 400;
  }
  .ph-table td {
    padding: .9rem 1rem; border-bottom: 1px solid #111;
    font-size: .78rem; vertical-align: middle;
  }
  .ph-table tr:last-child td { border-bottom: none; }
  .ph-amount { font-family: 'DM Mono', monospace; color: #6ee7a0; font-size: .85rem; }
  .ph-descriptor {
    font-family: 'DM Mono', monospace; font-size: .65rem;
    letter-spacing: .1em; color: #6ee7a0;
  }
  .ph-merchant { font-weight: 400; }
  .ph-reason {
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; white-space: nowrap;
  }
  .ph-date { font-size: .65rem; color: #2e2e2e; white-space: nowrap; }
  .ph-total {
    display: flex; justify-content: flex-end; align-items: baseline;
    gap: .5rem; margin-bottom: 1.5rem;
  }
  .ph-total-label { font-size: .65rem; color: #4b4b4b; letter-spacing: .1em; text-transform: uppercase; }
  .ph-total-value { font-family: 'DM Serif Display', serif; font-size: 1.75rem; color: #6ee7a0; }
`;

const REASON_LABEL = {
  submission_approved: 'Submission approved',
  upvote_received:     'Upvote received',
};

export default function PointsHistoryPage({ totalPoints }) {
  const { apiFetch }          = useAuth();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/users/me/points')
      .then(r => r.json())
      .then(d => setRows(d.points || []))
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

      {loading && <p className="ph-empty">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="ph-empty">No points earned yet — start by submitting a descriptor match.</p>
      )}

      {!loading && rows.length > 0 && (
        <table className="ph-table">
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
        </table>
      )}
    </>
  );
}
