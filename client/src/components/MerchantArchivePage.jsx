import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .ma-page { max-width: 960px; margin: 0 auto; padding: 0 0 2rem; }
  .ma-header { margin-bottom: 2rem; }
  .ma-title { font-family: var(--font-display); font-size: 2rem; margin-bottom: .5rem; }
  .ma-sub { font-size: .75rem; color: var(--text-muted); }

  .ma-controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .ma-search {
    flex: 1; min-width: 200px;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: .6rem .9rem; color: var(--text); font-family: var(--font-ui); font-size: .8rem;
  }
  .ma-search:focus { outline: none; border-color: var(--accent); }
  .ma-search::placeholder { color: var(--text-dim); }

  .ma-count { font-size: .65rem; color: var(--text-muted); letter-spacing: .06em; margin-bottom: .75rem; }

  .ma-table { width: 100%; border-collapse: collapse; }
  .ma-th {
    font-size: .55rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); text-align: left; padding: .6rem 1rem;
    border-bottom: 1px solid var(--border); white-space: nowrap;
    cursor: pointer; background: none; border-top: none; border-left: none; border-right: none;
    font-family: var(--font-ui);
  }
  .ma-th:hover { color: var(--text); }
  .ma-th.sorted { color: var(--accent); }

  .ma-tr { border-bottom: 1px solid var(--bg-card); transition: background .15s; }
  .ma-tr:hover { background: var(--bg-card); }
  .ma-td { padding: .7rem 1rem; font-size: .8rem; color: var(--text); vertical-align: middle; }

  .ma-name-cell { display: flex; align-items: center; gap: .75rem; }
  .ma-logo { width: 28px; height: 28px; object-fit: contain; border-radius: 2px; flex-shrink: 0; }
  .ma-logo-placeholder { width: 28px; height: 28px; background: var(--bg-page); border: 1px solid var(--border); border-radius: 2px; flex-shrink: 0; }
  .ma-name { font-family: var(--font-display); font-size: .9rem; }

  .ma-location { font-size: .75rem; color: var(--text-muted); }
  .ma-website  { font-size: .72rem; color: var(--accent); text-decoration: none; }
  .ma-website:hover { text-decoration: underline; }
  .ma-dash { color: var(--text-dim); font-size: .7rem; }

  .ma-count-cell { font-size: .75rem; color: var(--text-dim); }
  .ma-count-approved { color: var(--accent); font-size: .75rem; }
  .ma-count-pending  { color: var(--warning); font-size: .75rem; }

  .ma-state { text-align: center; padding: 3rem; font-size: .8rem; letter-spacing: .08em; }
  .ma-state.loading { color: var(--text-muted); }
  .ma-state.error   { color: var(--error); }
  .ma-state.empty   { color: var(--text-muted); }

  .ma-backfill-bar {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: .75rem 1rem; margin-bottom: 1.5rem;
  }
  .ma-backfill-text { font-size: .72rem; color: var(--text-muted); flex: 1; }
  .ma-backfill-text strong { color: var(--text); }
  .ma-backfill-btn {
    padding: .5rem 1rem; border-radius: 2px; border: 1px solid var(--accent);
    background: none; color: var(--accent); font-family: var(--font-ui);
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: background .2s, color .2s;
  }
  .ma-backfill-btn:hover:not(:disabled) { background: var(--accent); color: var(--bg-page); }
  .ma-backfill-btn:disabled { opacity: .4; cursor: not-allowed; }
  .ma-backfill-result { font-size: .7rem; color: var(--accent); }

  @media (max-width: 640px) {
    .ma-th.hide-mobile, .ma-td.hide-mobile { display: none; }
  }
`;

export default function MerchantArchivePage() {
  const { apiFetch }              = useAuth();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [q, setQ]                 = useState('');
  const [sortKey, setSortKey]     = useState('name');
  const [sortDir, setSortDir]     = useState('asc');
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const debounceRef               = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(q), 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  async function load(query) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const qs  = params.toString();
      const res = await apiFetch(`/api/merchants${qs ? '?' + qs : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setMerchants(data.merchants);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...merchants].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    va = va ?? (typeof va === 'number' ? 0 : '');
    vb = vb ?? (typeof vb === 'number' ? 0 : '');
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  async function runBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res  = await apiFetch('/api/admin/backfill-logos', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backfill failed');
      setBackfillResult(data);
      load(q); // refresh merchant list so new logos appear
    } catch (e) {
      setBackfillResult({ error: e.message });
    } finally {
      setBackfilling(false);
    }
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ma-page">
        <div className="ma-header">
          <div className="ma-title">Merchants</div>
          <div className="ma-sub">All merchants in the database</div>
        </div>

        {(() => {
          const missing = merchants.filter(m => !m.logo_url).length;
          if (loading || missing === 0) return null;
          return (
            <div className="ma-backfill-bar">
              <span className="ma-backfill-text">
                <strong>{missing}</strong> merchant{missing !== 1 ? 's' : ''} without a logo
              </span>
              {backfillResult && !backfillResult.error && (
                <span className="ma-backfill-result">
                  ✓ {backfillResult.updated} generated, {backfillResult.skipped} skipped
                </span>
              )}
              {backfillResult?.error && (
                <span style={{ fontSize: '.7rem', color: 'var(--error)' }}>{backfillResult.error}</span>
              )}
              <button className="ma-backfill-btn" onClick={runBackfill} disabled={backfilling}>
                {backfilling ? 'Generating…' : 'Generate missing logos'}
              </button>
            </div>
          );
        })()}

        <div className="ma-controls">
          <input
            type="text"
            className="ma-search"
            placeholder="Search by name…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="ma-state loading">Loading merchants…</div>
        ) : error ? (
          <div className="ma-state error">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="ma-state empty">No merchants found.</div>
        ) : (
          <>
            <div className="ma-count">{sorted.length} merchant{sorted.length !== 1 ? 's' : ''}</div>
            <table className="ma-table">
              <thead>
                <tr>
                  <th className={`ma-th ${sortKey === 'name' ? 'sorted' : ''}`} onClick={() => toggleSort('name')}>
                    Name{sortIcon('name')}
                  </th>
                  <th className={`ma-th hide-mobile ${sortKey === 'location' ? 'sorted' : ''}`} onClick={() => toggleSort('location')}>
                    Location{sortIcon('location')}
                  </th>
                  <th className="ma-th hide-mobile">Website</th>
                  <th className={`ma-th ${sortKey === 'approved_count' ? 'sorted' : ''}`} onClick={() => toggleSort('approved_count')}>
                    Approved{sortIcon('approved_count')}
                  </th>
                  <th className={`ma-th ${sortKey === 'pending_count' ? 'sorted' : ''}`} onClick={() => toggleSort('pending_count')}>
                    Pending{sortIcon('pending_count')}
                  </th>
                  <th className={`ma-th hide-mobile ${sortKey === 'submission_count' ? 'sorted' : ''}`} onClick={() => toggleSort('submission_count')}>
                    Total{sortIcon('submission_count')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(m => (
                  <tr key={m.id} className="ma-tr">
                    <td className="ma-td">
                      <div className="ma-name-cell">
                        {m.logo_url
                          ? <img className="ma-logo" src={m.logo_url} alt={m.name} />
                          : <div className="ma-logo-placeholder" />
                        }
                        <span className="ma-name">{m.name}</span>
                      </div>
                    </td>
                    <td className="ma-td hide-mobile">
                      {m.location
                        ? <span className="ma-location">{m.location}</span>
                        : <span className="ma-dash">—</span>
                      }
                    </td>
                    <td className="ma-td hide-mobile">
                      {m.website
                        ? <a className="ma-website" href={m.website} target="_blank" rel="noreferrer">{m.website.replace(/^https?:\/\//, '')}</a>
                        : <span className="ma-dash">—</span>
                      }
                    </td>
                    <td className="ma-td">
                      <span className={m.approved_count > 0 ? 'ma-count-approved' : 'ma-count-cell'}>{m.approved_count}</span>
                    </td>
                    <td className="ma-td">
                      <span className={m.pending_count > 0 ? 'ma-count-pending' : 'ma-count-cell'}>{m.pending_count}</span>
                    </td>
                    <td className="ma-td hide-mobile">
                      <span className="ma-count-cell">{m.submission_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
