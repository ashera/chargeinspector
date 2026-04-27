import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .ca-page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
  .ca-header { margin-bottom: 2rem; }
  .ca-title { font-family: var(--font-display); font-size: 1.4rem; color: var(--text); margin-bottom: .3rem; }
  .ca-sub { font-size: .65rem; color: var(--text-muted); letter-spacing: .08em; }

  .ca-controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .ca-search {
    flex: 1; min-width: 200px;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: .6rem .9rem; color: var(--text); font-family: var(--font-ui); font-size: .8rem;
  }
  .ca-search:focus { outline: none; border-color: var(--accent); }
  .ca-search::placeholder { color: var(--text-dim); }

  .ca-tabs { display: flex; gap: 0; flex-shrink: 0; }
  .ca-tab {
    padding: .5rem .9rem; font-size: .6rem; letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; background: none; border: 1px solid var(--border);
    color: var(--text-muted); font-family: var(--font-ui); margin-left: -1px;
  }
  .ca-tab:first-child { border-radius: 3px 0 0 3px; }
  .ca-tab:last-child  { border-radius: 0 3px 3px 0; }
  .ca-tab.active { background: var(--bg-card); color: var(--text); border-color: var(--accent); z-index: 1; position: relative; }
  .ca-tab:hover:not(.active) { color: var(--text); }

  .ca-count { font-size: .65rem; color: var(--text-muted); letter-spacing: .06em; margin-bottom: .75rem; }

  .ca-table { width: 100%; border-collapse: collapse; }
  .ca-th {
    font-size: .55rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); text-align: left; padding: .6rem 1rem;
    border-bottom: 1px solid var(--border); white-space: nowrap;
    cursor: pointer; background: none; border-top: none; border-left: none; border-right: none;
    font-family: var(--font-ui);
  }
  .ca-th:hover { color: var(--text); }
  .ca-th.sorted { color: var(--accent); }

  .ca-tr { cursor: pointer; border-bottom: 1px solid var(--bg-card); transition: background .15s; }
  .ca-tr:hover { background: var(--bg-card); }
  .ca-td { padding: .75rem 1rem; font-size: .8rem; color: var(--text); vertical-align: middle; }

  .ca-descriptor { font-family: var(--font-ui); color: var(--amber); letter-spacing: .06em; font-size: .75rem; }
  .ca-merchant   { color: var(--text-muted); font-size: .75rem; }
  .ca-dash       { color: var(--text-dim); font-size: .7rem; }

  .ca-status {
    font-size: .55rem; letter-spacing: .12em; text-transform: uppercase;
    padding: .2rem .6rem; border-radius: 2px; white-space: nowrap; display: inline-block;
  }
  .ca-status.open          { color: var(--warning); border: 1px solid #3a3010; background: #1a1608; }
  .ca-status.investigating { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .ca-status.solved        { color: #7fff7f;        border: 1px solid #1e3a2a; background: #0d1a0f; }

  .ca-detectives { font-size: .75rem; color: var(--text-dim); }
  .ca-date { font-size: .7rem; color: var(--text-dim); white-space: nowrap; }

  .ca-state { text-align: center; padding: 3rem; font-size: .8rem; letter-spacing: .08em; }
  .ca-state.loading { color: var(--text-muted); }
  .ca-state.error   { color: var(--error); }
  .ca-state.empty   { color: var(--text-muted); }

  .ca-actions { white-space: nowrap; }
  .ca-reopen-btn {
    padding: .3rem .75rem; border-radius: 2px; border: 1px solid var(--border);
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
  }
  .ca-reopen-btn:hover { border-color: var(--warning); color: var(--warning); }
  .ca-reopen-confirm {
    padding: .3rem .65rem; border-radius: 2px; border: 1px solid var(--warning);
    background: none; color: var(--warning); font-family: var(--font-ui);
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
    margin-right: .4rem;
  }
  .ca-reopen-confirm:disabled { opacity: .45; cursor: default; }
  .ca-reopen-cancel {
    padding: .3rem .65rem; border-radius: 2px; border: 1px solid var(--border);
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
  }

  @media (max-width: 640px) {
    .ca-controls { flex-direction: column; align-items: stretch; }
    .ca-tabs { justify-content: center; }
    .ca-th.hide-mobile, .ca-td.hide-mobile { display: none; }
  }
`;

const STATUS_TABS = [
  { key: '',            label: 'All'          },
  { key: 'open',        label: 'Open'         },
  { key: 'investigating', label: 'Investigating' },
  { key: 'solved',      label: 'Solved'       },
];

export default function CaseArchivePage({ navigate }) {
  const { apiFetch, user }      = useAuth();
  const isAdmin                 = user?.role === 'admin' || user?.role === 'moderator';
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [q, setQ]               = useState('');
  const [status, setStatus]     = useState('');
  const [sortKey, setSortKey]   = useState('created_at');
  const [sortDir, setSortDir]   = useState('desc');
  const [reopening, setReopening] = useState(null);   // case id awaiting confirmation
  const [reopenBusy, setReopenBusy] = useState(false);
  const debounceRef             = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadCases(q), 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  useEffect(() => { loadCases(q); }, [status]);

  async function loadCases(query) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const qs = params.toString();
      const res = await apiFetch(`/api/cases${qs ? '?' + qs : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCases(data.cases);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = status ? cases.filter(c => c.computed_status === status) : cases;

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (sortKey === 'created_at') {
      va = new Date(va).getTime();
      vb = new Date(vb).getTime();
    } else if (sortKey === 'detective_count') {
      va = va ?? 0;
      vb = vb ?? 0;
    } else {
      va = (va || '').toLowerCase();
      vb = (vb || '').toLowerCase();
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const counts = {
    '':            cases.length,
    open:          cases.filter(c => c.computed_status === 'open').length,
    investigating: cases.filter(c => c.computed_status === 'investigating').length,
    solved:        cases.filter(c => c.computed_status === 'solved').length,
  };

  const openCase = async (caseRow) => {
    try {
      const res = await fetch(`/api/cases/${caseRow.id}`);
      const data = await res.json();
      if (res.ok && data.case) navigate('case', { caseData: data.case });
      else navigate('case', { caseData: caseRow });
    } catch {
      navigate('case', { caseData: caseRow });
    }
  };

  const confirmReopen = async (caseId) => {
    setReopenBusy(true);
    try {
      const res  = await apiFetch(`/api/admin/cases/${caseId}/reopen`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reopen case');
      setCases(prev => prev.map(c =>
        c.id === caseId
          ? { ...c, computed_status: 'open', solved_merchant_name: null }
          : c
      ));
      setReopening(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setReopenBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ca-page">
        <div className="ca-header">
          <div className="ca-title">Case Archive</div>
          <div className="ca-sub">All open investigations and solved cases</div>
        </div>

        <div className="ca-controls">
          <input
            type="text"
            className="ca-search"
            placeholder="Search by descriptor…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <div className="ca-tabs">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                className={`ca-tab ${status === t.key ? 'active' : ''}`}
                onClick={() => setStatus(t.key)}
              >
                {t.label} ({counts[t.key] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ca-state loading">Loading cases…</div>
        ) : error ? (
          <div className="ca-state error">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="ca-state empty">No cases found.</div>
        ) : (
          <>
            <div className="ca-count">{sorted.length} case{sorted.length !== 1 ? 's' : ''}</div>
            <table className="ca-table">
              <thead>
                <tr>
                  <th className={`ca-th ${sortKey === 'descriptor' ? 'sorted' : ''}`} onClick={() => toggleSort('descriptor')}>
                    Descriptor{sortIcon('descriptor')}
                  </th>
                  <th className={`ca-th ${sortKey === 'computed_status' ? 'sorted' : ''}`} onClick={() => toggleSort('computed_status')}>
                    Status{sortIcon('computed_status')}
                  </th>
                  <th className="ca-th hide-mobile">Merchant</th>
                  <th className={`ca-th hide-mobile ${sortKey === 'detective_count' ? 'sorted' : ''}`} onClick={() => toggleSort('detective_count')}>
                    Detectives{sortIcon('detective_count')}
                  </th>
                  <th className={`ca-th ${sortKey === 'created_at' ? 'sorted' : ''}`} onClick={() => toggleSort('created_at')}>
                    Created{sortIcon('created_at')}
                  </th>
                  {isAdmin && <th className="ca-th">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr key={c.id} className="ca-tr" onClick={() => openCase(c)}>
                    <td className="ca-td"><span className="ca-descriptor">{c.descriptor}</span></td>
                    <td className="ca-td">
                      <span className={`ca-status ${c.computed_status}`}>{c.computed_status}</span>
                    </td>
                    <td className="ca-td hide-mobile">
                      {c.solved_merchant_name
                        ? <span className="ca-merchant">{c.solved_merchant_name}</span>
                        : <span className="ca-dash">—</span>
                      }
                    </td>
                    <td className="ca-td hide-mobile">
                      <span className="ca-detectives">{c.detective_count ?? 0}</span>
                    </td>
                    <td className="ca-td">
                      <span className="ca-date">
                        {new Date(c.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="ca-td ca-actions" onClick={e => e.stopPropagation()}>
                        {c.computed_status === 'solved' && (
                          reopening === c.id ? (
                            <>
                              <button
                                className="ca-reopen-confirm"
                                onClick={() => confirmReopen(c.id)}
                                disabled={reopenBusy}
                              >
                                {reopenBusy ? '…' : 'Confirm'}
                              </button>
                              <button
                                className="ca-reopen-cancel"
                                onClick={() => setReopening(null)}
                                disabled={reopenBusy}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="ca-reopen-btn"
                              onClick={() => setReopening(c.id)}
                            >
                              Reopen
                            </button>
                          )
                        )}
                      </td>
                    )}
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
