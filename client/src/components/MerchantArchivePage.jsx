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

  .ma-tr { border-bottom: 1px solid var(--bg-card); transition: background .15s; cursor: pointer; }
  .ma-tr:hover { background: var(--bg-card); }
  .ma-tr.selected { background: #0d1a0f; }
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

  /* Edit panel */
  .ma-edit-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200;
    display: flex; align-items: flex-start; justify-content: flex-end;
  }
  .ma-edit-panel {
    width: 420px; max-width: 100vw; height: 100vh; overflow-y: auto;
    background: var(--bg-page); border-left: 1px solid var(--border);
    padding: 2rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;
  }
  .ma-edit-title {
    font-family: var(--font-display); font-size: 1.2rem; color: var(--text); margin-bottom: .25rem;
  }
  .ma-edit-id { font-size: .6rem; color: var(--text-dim); letter-spacing: .1em; }
  .ma-edit-logo-preview {
    width: 64px; height: 64px; border-radius: 6px; object-fit: contain;
    background: var(--bg-card); border: 1px solid var(--border);
  }
  .ma-edit-logo-placeholder {
    width: 64px; height: 64px; border-radius: 6px;
    background: var(--bg-card); border: 1px solid var(--border);
  }
  .ma-edit-field { display: flex; flex-direction: column; gap: .4rem; }
  .ma-edit-label {
    font-size: .6rem; letter-spacing: .12em; text-transform: uppercase;
    color: var(--text-muted); font-family: var(--font-ui);
  }
  .ma-edit-input, .ma-edit-textarea {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: .6rem .85rem; color: var(--text); font-family: var(--font-ui); font-size: .82rem;
    width: 100%; box-sizing: border-box;
  }
  .ma-edit-input:focus, .ma-edit-textarea:focus { outline: none; border-color: var(--accent); }
  .ma-edit-textarea { resize: vertical; min-height: 60px; }
  .ma-edit-actions { display: flex; gap: .75rem; margin-top: .5rem; }
  .ma-edit-save {
    flex: 1; padding: .65rem; border-radius: 2px;
    background: var(--accent); color: var(--bg-page); border: none;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; transition: opacity .2s;
  }
  .ma-edit-save:disabled { opacity: .4; cursor: not-allowed; }
  .ma-edit-cancel {
    padding: .65rem 1.25rem; border-radius: 2px;
    background: none; color: var(--text-muted); border: 1px solid var(--border);
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer;
  }
  .ma-edit-cancel:hover { color: var(--text); border-color: var(--text-muted); }
  .ma-edit-error { font-size: .72rem; color: var(--error); }
  .ma-edit-saved { font-size: .72rem; color: var(--accent); }

  @media (max-width: 640px) {
    .ma-th.hide-mobile, .ma-td.hide-mobile { display: none; }
    .ma-edit-panel { width: 100vw; }
  }
`;

function EditPanel({ merchant, onSave, onClose, apiFetch }) {
  const [form, setForm]   = useState({
    name:     merchant.name     || '',
    location: merchant.location || '',
    website:  merchant.website  || '',
    logo_url: merchant.logo_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [saved, setSaved]   = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res  = await apiFetch(`/api/merchants/${merchant.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      onSave(data.merchant);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const logoPreview = form.logo_url?.trim();

  return (
    <div className="ma-edit-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ma-edit-panel">
        <div>
          <div className="ma-edit-title">Edit Merchant</div>
          <div className="ma-edit-id">#{merchant.id.slice(0, 8).toUpperCase()}</div>
        </div>

        {logoPreview
          ? <img className="ma-edit-logo-preview" src={logoPreview} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <div className="ma-edit-logo-placeholder" />
        }

        <div className="ma-edit-field">
          <label className="ma-edit-label">Name *</label>
          <input className="ma-edit-input" value={form.name} onChange={set('name')} />
        </div>
        <div className="ma-edit-field">
          <label className="ma-edit-label">Location</label>
          <input className="ma-edit-input" placeholder="e.g. London, UK" value={form.location} onChange={set('location')} />
        </div>
        <div className="ma-edit-field">
          <label className="ma-edit-label">Website</label>
          <input className="ma-edit-input" placeholder="https://example.com" value={form.website} onChange={set('website')} />
        </div>
        <div className="ma-edit-field">
          <label className="ma-edit-label">Logo URL</label>
          <input className="ma-edit-input" placeholder="https://example.com/logo.png or data:image/svg…" value={form.logo_url} onChange={set('logo_url')} />
        </div>

        {error && <div className="ma-edit-error">{error}</div>}
        {saved && <div className="ma-edit-saved">✓ Saved</div>}

        <div className="ma-edit-actions">
          <button className="ma-edit-save" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button className="ma-edit-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function MerchantArchivePage() {
  const { apiFetch }              = useAuth();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [q, setQ]                 = useState('');
  const [sortKey, setSortKey]     = useState('name');
  const [sortDir, setSortDir]     = useState('asc');
  const [backfilling, setBackfilling]     = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [editing, setEditing]     = useState(null);
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

  function handleSave(updated) {
    setMerchants(ms => ms.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    if (editing?.id === updated.id) setEditing(prev => ({ ...prev, ...updated }));
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
      load(q);
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
          <div className="ma-sub">All merchants in the database — click a row to edit</div>
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
                  <tr key={m.id} className={`ma-tr${editing?.id === m.id ? ' selected' : ''}`} onClick={() => setEditing(m)}>
                    <td className="ma-td">
                      <div className="ma-name-cell">
                        {m.logo_url
                          ? <img className="ma-logo" src={m.logo_url} alt={m.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
                          : <div className="ma-logo-placeholder" />
                        }
                        <span className="ma-name">{m.name}</span>
                      </div>
                    </td>
                    <td className="ma-td hide-mobile">
                      {m.location ? <span className="ma-location">{m.location}</span> : <span className="ma-dash">—</span>}
                    </td>
                    <td className="ma-td hide-mobile">
                      {m.website
                        ? <a className="ma-website" href={m.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                            {m.website.replace(/^https?:\/\//, '')}
                          </a>
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

      {editing && (
        <EditPanel
          merchant={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          apiFetch={apiFetch}
        />
      )}
    </>
  );
}
