import { useAuth } from '../hooks/useAuth.jsx';
import { useState, useEffect } from 'react';

const CSS = `
  .md-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer; background: none; border: none;
    font-family: 'DM Mono', monospace; padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .md-back:hover { color: #f0ede6; }
  .md-header { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 2rem; }
  .md-logo {
    width: 72px; height: 72px; border-radius: 4px;
    object-fit: contain; background: #1a1a1a; flex-shrink: 0;
  }
  .md-logo-placeholder {
    width: 72px; height: 72px; border-radius: 4px;
    background: #1a1a1a; border: 1px solid #1e1e1e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 2rem;
  }
  .md-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: #6ee7a0; margin-bottom: .4rem;
  }
  .md-name {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem; line-height: 1.1; margin-bottom: .5rem;
  }
  .md-section { margin-bottom: 2rem; }
  .md-section-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: 1rem; border-bottom: 1px solid #1e1e1e;
    padding-bottom: .5rem;
  }
  .md-row { display: flex; gap: 1rem; margin-bottom: .75rem; font-size: .8rem; }
  .md-label { color: #4b4b4b; width: 100px; flex-shrink: 0; font-size: .7rem; }
  .md-value { color: #f0ede6; }
  .md-value a { color: #6ee7a0; text-decoration: none; }
  .md-value a:hover { text-decoration: underline; }
  .md-votes {
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;
  }
  .md-votes-count { font-family: 'DM Serif Display', serif; font-size: 2rem; color: #6ee7a0; }
  .md-votes-label { font-size: .7rem; color: #4b4b4b; margin-top: .2rem; }
  .md-vote-btn {
    padding: .7rem 1.5rem; border-radius: 2px;
    font-family: 'DM Mono', monospace; font-size: .65rem;
    letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: 1px solid #6ee7a0;
    background: none; color: #6ee7a0;
    transition: background .2s, color .2s;
  }
  .md-vote-btn:hover:not(:disabled) { background: #6ee7a0; color: #0a0a0a; }
  .md-vote-btn:disabled { opacity: .35; cursor: not-allowed; }
  .md-msg { font-size: .7rem; margin-top: .75rem; }
  .md-msg.ok  { color: #6ee7a0; }
  .md-msg.err { color: #e05c5c; }
  .md-map {
    width: 100%; height: 300px; border-radius: 3px;
    border: 1px solid #1e1e1e; display: block;
  }
  .md-descriptor-list { list-style: none; padding: 0; margin: 0; }
  .md-descriptor-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: .65rem 0; border-bottom: 1px solid #111;
    font-family: 'DM Mono', monospace; font-size: .75rem;
    letter-spacing: .08em; color: #6ee7a0;
  }
  .md-descriptor-item:last-child { border-bottom: none; }
  .md-descriptor-votes { font-size: .65rem; color: #2e2e2e; letter-spacing: 0; }
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

      <button className="md-back" onClick={() => navigate('search')}>← Back to search</button>

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
                <span>{d.descriptor}</span>
                <span className="md-descriptor-votes">{d.upvote_count} confirmation{d.upvote_count !== 1 ? 's' : ''}</span>
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
