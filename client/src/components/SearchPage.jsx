import { useState, useRef } from 'react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
  .sp-hero { text-align: center; padding: 3rem 0 2rem; }
  .sp-headline {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.1;
    margin-bottom: .75rem;
  }
  .sp-headline em { font-style: italic; color: #6ee7a0; }
  .sp-sub { font-size: .75rem; color: #4b4b4b; line-height: 1.6; margin-bottom: 2rem; }
  .sp-form { display: flex; gap: .75rem; max-width: 600px; margin: 0 auto; }
  .sp-input {
    flex: 1;
    padding: .85rem 1.1rem;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 2px;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    font-size: .85rem;
    outline: none;
    transition: border-color .2s;
  }
  .sp-input:focus { border-color: #6ee7a0; }
  .sp-input::placeholder { color: #2e2e2e; }
  .sp-btn {
    padding: .85rem 1.5rem;
    background: #6ee7a0;
    border: none;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: .7rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #0a0a0a;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .sp-btn:disabled { opacity: .4; cursor: not-allowed; }
  .sp-results { margin-top: 2.5rem; }
  .sp-empty { text-align: center; color: #4b4b4b; font-size: .75rem; padding: 3rem 0; }
  .sp-card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 3px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }
  .sp-logo {
    width: 56px;
    height: 56px;
    border-radius: 3px;
    object-fit: contain;
    background: #1a1a1a;
    flex-shrink: 0;
  }
  .sp-logo-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 3px;
    background: #1a1a1a;
    border: 1px solid #1e1e1e;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  .sp-card-body { flex: 1; min-width: 0; }
  .sp-descriptor {
    font-size: .7rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #6ee7a0;
    margin-bottom: .4rem;
  }
  .sp-merchant-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.3rem;
    margin-bottom: .3rem;
  }
  .sp-meta {
    font-size: .7rem;
    color: #4b4b4b;
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    margin-top: .5rem;
  }
  .sp-meta a { color: #6ee7a0; text-decoration: none; }
  .sp-meta a:hover { text-decoration: underline; }
  .sp-votes { font-size: .65rem; color: #4b4b4b; margin-top: .5rem; }
`;

export default function SearchPage({ navigate }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy]       = useState(false);
  const inputRef              = useRef(null);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-hero">
        <h1 className="sp-headline">Who <em>charged</em> me?</h1>
        <p className="sp-sub">
          Paste the billing descriptor from your bank statement to find out who really charged you.
        </p>
        <div className="sp-form">
          <input
            ref={inputRef}
            className="sp-input"
            placeholder="e.g. SQ *COFFEE NYC or TST* RESTAURANT"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            autoFocus
          />
          <button className="sp-btn" onClick={search} disabled={busy || !query.trim()}>
            {busy ? '…' : 'Look up'}
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="sp-results">
          {results.length === 0 ? (
            <div className="sp-empty">
              <p>No results found for <strong>"{query}"</strong>.</p>
              <p style={{ marginTop: '.5rem' }}>
                Know who this is?{' '}
                <span
                  style={{ color: '#6ee7a0', cursor: 'pointer' }}
                  onClick={() => navigate('submit', { descriptor: query })}
                >
                  Submit a match →
                </span>
              </p>
            </div>
          ) : (
            results.map(r => (
              <div key={r.descriptor_id} className="sp-card">
                {r.logo_url
                  ? <img className="sp-logo" src={r.logo_url} alt={r.name} />
                  : <div className="sp-logo-placeholder">🏪</div>
                }
                <div className="sp-card-body">
                  <div className="sp-descriptor">{r.descriptor}</div>
                  <div className="sp-merchant-name">{r.name}</div>
                  <div className="sp-meta">
                    {r.location && <span>📍 {r.location}</span>}
                    {r.website  && <a href={r.website} target="_blank" rel="noreferrer">🌐 {r.website}</a>}
                  </div>
                  <div className="sp-votes">{r.upvote_count} confirmation{r.upvote_count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
