import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import CaseArchivePage from './CaseArchivePage.jsx';

const CSS = `
  .adm-tabs {
    display: flex; gap: 0; margin-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }
  .adm-tab {
    padding: .75rem 1.25rem; font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; background: none; border: none; border-bottom: 2px solid transparent;
    color: var(--text-muted); font-family: var(--font-ui); margin-bottom: -1px;
    transition: color .2s, border-color .2s;
  }
  .adm-tab:hover { color: var(--text); }
  .adm-tab.active { color: var(--text); border-bottom-color: var(--accent); }

  .adm-title { font-family: var(--font-display); font-size: 2rem; margin-bottom: .5rem; }
  .adm-sub { font-size: .75rem; color: var(--text-muted); margin-bottom: 2rem; }
  .adm-empty { font-size: .75rem; color: var(--text-muted); padding: 2rem 0; }
  .adm-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem; margin-bottom: 1rem;
  }
  .adm-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); margin-bottom: .5rem;
  }
  .adm-merchant { font-family: var(--font-display); font-size: 1.3rem; margin-bottom: .25rem; }
  .adm-meta { font-size: .7rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1rem; }
  .adm-meta a { color: var(--accent); text-decoration: none; }
  .adm-submitter { font-size: .65rem; color: var(--text-dim); margin-bottom: 1rem; }
  .adm-btns { display: flex; gap: .75rem; }
  .adm-btn {
    padding: .6rem 1.25rem; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem;
    letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: 1px solid var(--border);
    background: none; color: var(--text-muted);
    transition: color .2s, border-color .2s;
  }
  .adm-btn:disabled { opacity: .3; cursor: not-allowed; }
  .adm-btn.approve { background: var(--accent); color: var(--bg-page); border-color: var(--accent); }
  .adm-btn.reject:hover { color: var(--error); border-color: var(--error); }
  .adm-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 2px; float: right; }
`;

function ModerationQueue() {
  const { apiFetch }      = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/api/submissions/pending')
      .then(r => r.json())
      .then(d => setItems(d.submissions || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id, action) => {
    setActing(id);
    setError('');
    try {
      const res = await apiFetch(`/api/submissions/${id}/${action}`, { method: 'PUT' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Action failed (${res.status})`);
        return;
      }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <h1 className="adm-title">Moderation queue</h1>
      <p className="adm-sub">
        {loading ? 'Loading…' : `${items.length} submission${items.length !== 1 ? 's' : ''} pending review`}
      </p>
      {error && <p style={{ color: 'var(--error)', fontSize: '.75rem', marginBottom: '1rem' }}>{error}</p>}
      {!loading && items.length === 0 && <p className="adm-empty">Queue is clear ✓</p>}
      {items.map(s => (
        <div key={s.id} className="adm-card">
          {s.logo_url && <img className="adm-logo" src={s.logo_url} alt={s.name} />}
          <div className="adm-descriptor">{s.descriptor}</div>
          <div className="adm-merchant">{s.name}</div>
          <div className="adm-meta">
            {s.location && <span>📍 {s.location}</span>}
            {s.website  && <a href={s.website} target="_blank" rel="noreferrer">🌐 {s.website}</a>}
          </div>
          <div className="adm-submitter">Submitted by {s.submitted_by_email}</div>
          <div className="adm-btns">
            <button className="adm-btn approve" disabled={acting === s.id} onClick={() => act(s.id, 'approve')}>
              Approve +10pts
            </button>
            <button className="adm-btn reject" disabled={acting === s.id} onClick={() => act(s.id, 'reject')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminPage({ navigate }) {
  const [tab, setTab] = useState('queue');

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-tabs">
        <button className={`adm-tab ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>
          Moderation Queue
        </button>
        <button className={`adm-tab ${tab === 'cases' ? 'active' : ''}`} onClick={() => setTab('cases')}>
          Case Archive
        </button>
      </div>
      {tab === 'queue' && <ModerationQueue />}
      {tab === 'cases' && <CaseArchivePage navigate={navigate} />}
    </>
  );
}
