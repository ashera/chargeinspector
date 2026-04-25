import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .adm-title { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: .5rem; }
  .adm-sub { font-size: .75rem; color: #888; margin-bottom: 2rem; }
  .adm-empty { font-size: .75rem; color: #888; padding: 2rem 0; }
  .adm-card {
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1.25rem; margin-bottom: 1rem;
  }
  .adm-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: #6ee7a0; margin-bottom: .5rem;
  }
  .adm-merchant { font-family: 'DM Serif Display', serif; font-size: 1.3rem; margin-bottom: .25rem; }
  .adm-meta { font-size: .7rem; color: #888; display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1rem; }
  .adm-meta a { color: #6ee7a0; text-decoration: none; }
  .adm-submitter { font-size: .65rem; color: #4b4b4b; margin-bottom: 1rem; }
  .adm-btns { display: flex; gap: .75rem; }
  .adm-btn {
    padding: .6rem 1.25rem; border-radius: 2px;
    font-family: 'DM Mono', monospace; font-size: .65rem;
    letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: 1px solid #1e1e1e;
    background: none; color: #888;
    transition: color .2s, border-color .2s;
  }
  .adm-btn:disabled { opacity: .3; cursor: not-allowed; }
  .adm-btn.approve { background: #6ee7a0; color: #0a0a0a; border-color: #6ee7a0; }
  .adm-btn.reject:hover { color: #e05c5c; border-color: #e05c5c; }
  .adm-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 2px; float: right; }
`;

export default function AdminPage() {
  const { apiFetch }                = useAuth();
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState(null);
  const [error, setError]           = useState('');

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
      <style>{CSS}</style>
      <h1 className="adm-title">Moderation queue</h1>
      <p className="adm-sub">
        {loading ? 'Loading…' : `${items.length} submission${items.length !== 1 ? 's' : ''} pending review`}
      </p>

      {error && (
        <p style={{ color: '#e05c5c', fontSize: '.75rem', marginBottom: '1rem' }}>{error}</p>
      )}

      {!loading && items.length === 0 && (
        <p className="adm-empty">Queue is clear ✓</p>
      )}

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
            <button
              className="adm-btn approve"
              disabled={acting === s.id}
              onClick={() => act(s.id, 'approve')}
            >
              Approve +10pts
            </button>
            <button
              className="adm-btn reject"
              disabled={acting === s.id}
              onClick={() => act(s.id, 'reject')}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
