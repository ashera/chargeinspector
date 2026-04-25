import { useAuth } from '../hooks/useAuth.jsx';
import { useState, useEffect } from 'react';

const CSS = `
  .md-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .md-back:hover { color: var(--text); }
  .md-header { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 2rem; }
  .md-logo {
    width: 72px; height: 72px; border-radius: 4px;
    object-fit: contain; background: var(--bg-hover); flex-shrink: 0;
  }
  .md-logo-placeholder {
    width: 72px; height: 72px; border-radius: 4px;
    background: var(--bg-hover); border: 1px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 2rem;
  }
  .md-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); margin-bottom: .4rem;
  }
  .md-name {
    font-family: var(--font-display);
    font-size: 2rem; line-height: 1.1; margin-bottom: .5rem;
  }
  .md-section { margin-bottom: 2rem; }
  .md-section-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1rem; border-bottom: 1px solid var(--border);
    padding-bottom: .5rem;
  }
  .md-row { display: flex; gap: 1rem; margin-bottom: .75rem; font-size: .8rem; }
  .md-label { color: var(--text-muted); width: 100px; flex-shrink: 0; font-size: .7rem; }
  .md-value { color: var(--text); }
  .md-value a { color: var(--accent); text-decoration: none; }
  .md-value a:hover { text-decoration: underline; }
  .md-votes {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;
  }
  .md-votes-count { font-family: var(--font-display); font-size: 2rem; color: var(--accent); }
  .md-votes-label { font-size: .7rem; color: var(--text-muted); margin-top: .2rem; }
  .md-vote-btn {
    padding: .7rem 1.5rem; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem;
    letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: 1px solid var(--accent);
    background: none; color: var(--accent);
    transition: background .2s, color .2s;
  }
  .md-vote-btn:hover:not(:disabled) { background: var(--accent); color: var(--bg-page); }
  .md-vote-btn:disabled { opacity: .35; cursor: not-allowed; }
  .md-msg { font-size: .7rem; margin-top: .75rem; }
  .md-msg.ok  { color: var(--accent); }
  .md-msg.err { color: var(--error); }
  .md-map {
    width: 100%; height: 300px; border-radius: 3px;
    border: 1px solid var(--border); display: block;
  }
  .md-descriptor-list { list-style: none; padding: 0; margin: 0; }
  .md-descriptor-item {
    display: flex; align-items: center; gap: 1rem;
    padding: .65rem 0; border-bottom: 1px solid var(--bg-card);
  }
  .md-descriptor-item:last-child { border-bottom: none; }
  .md-descriptor-text {
    font-family: var(--font-ui); font-size: .75rem;
    letter-spacing: .08em; color: var(--accent); flex: 1;
  }
  .md-descriptor-votes { font-size: .65rem; color: var(--text-dim); white-space: nowrap; }
  .md-descriptor-btn {
    padding: .4rem .85rem; border: 1px solid var(--border); border-radius: 2px;
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s;
    flex-shrink: 0;
  }
  .md-descriptor-btn:hover { color: var(--text); border-color: var(--text-muted); }
  @media (max-width: 500px) {
    .md-header { gap: 1rem; }
    .md-name { font-size: 1.5rem; }
    .md-votes { flex-direction: column; gap: 1rem; }
    .md-vote-btn { width: 100%; }
    .md-map { height: 220px; }
    .md-descriptor-item { flex-wrap: wrap; }
  }
`;

export default function MerchantDetailsPage({ merchant, navigate }) {
  const { isAuthenticated, apiFetch } = useAuth();
  const [votes, setVotes]         = useState(merchant.upvote_count);
  const [busy, setBusy]           = useState(false);
  const [msg, setMsg]             = useState(null);
  const [descriptors, setDescriptors] = useState([]);

  useEffect(() => {
    fetch(`/api/merchants/${merchant.merchant_id}/descriptors`)
      .then(r => r.json())
      .then(d => setDescriptors(d.descriptors || []))
      .catch(() => {});
  }, [merchant.merchant_id]);

  const vote = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res  = await apiFetch(`/api/submissions/${merchant.submission_id}/vote`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || 'Could not record vote.', ok: false });
        return;
      }
      setVotes(v => v + 1);
      setMsg({ text: 'Vote recorded — thanks!', ok: true });
    } catch {
      setMsg({ text: 'Something went wrong.', ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <button className="md-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="md-header">
        {merchant.logo_url
          ? <img className="md-logo" src={merchant.logo_url} alt={merchant.name} />
          : <div className="md-logo-placeholder">🏪</div>
        }
        <div>
          <div className="md-descriptor">{merchant.descriptor}</div>
          <div className="md-name">{merchant.name}</div>
        </div>
      </div>

      <div className="md-section">
        <div className="md-section-title">Merchant details</div>
        {merchant.location && (
          <div className="md-row">
            <span className="md-label">Location</span>
            <span className="md-value">📍 {merchant.location}</span>
          </div>
        )}
        {merchant.website && (
          <div className="md-row">
            <span className="md-label">Website</span>
            <span className="md-value">
              <a href={merchant.website} target="_blank" rel="noreferrer">{merchant.website}</a>
            </span>
          </div>
        )}
        <div className="md-row">
          <span className="md-label">Descriptor</span>
          <span className="md-value" style={{ fontFamily: "'DM Mono', monospace", fontSize: '.75rem' }}>
            {merchant.descriptor}
          </span>
        </div>
      </div>

      {descriptors.length > 0 && (
        <div className="md-section">
          <div className="md-section-title">Linked billing descriptors</div>
          <ul className="md-descriptor-list">
            {descriptors.map(d => (
              <li key={d.descriptor} className="md-descriptor-item">
                <span className="md-descriptor-text">{d.descriptor}</span>
                <span className="md-descriptor-votes">{d.upvote_count} confirmation{d.upvote_count !== 1 ? 's' : ''}</span>
                <button
                  className="md-descriptor-btn"
                  onClick={() => navigate('descriptor', { descriptor: d.descriptor, descriptorId: d.descriptor_id })}
                >
                  View details
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {merchant.location && (
        <div className="md-section">
          <div className="md-section-title">Location</div>
          <iframe
            className="md-map"
            title="Merchant location"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${merchant.name} ${merchant.location}`)}&output=embed&z=15`}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="md-section">
        <div className="md-section-title">Community confirmations</div>
        <div className="md-votes">
          <div>
            <div className="md-votes-count">{votes}</div>
            <div className="md-votes-label">confirmation{votes !== 1 ? 's' : ''} from the community</div>
          </div>
          {isAuthenticated && (
            <button className="md-vote-btn" onClick={vote} disabled={busy}>
              {busy ? '…' : 'Confirm this match'}
            </button>
          )}
        </div>
        {msg && <p className={`md-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
      </div>
    </>
  );
}
