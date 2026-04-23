import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

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
  .sp-form-wrap { position: relative; max-width: 600px; margin: 0 auto; }
  .sp-form { display: flex; gap: .75rem; }
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
  .sp-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 2px;
    z-index: 200;
    overflow: hidden;
  }
  .sp-suggestion {
    display: flex; align-items: baseline; gap: .75rem;
    padding: .7rem 1.1rem; cursor: pointer;
    border-bottom: 1px solid #1a1a1a;
    transition: background .15s;
  }
  .sp-suggestion:last-child { border-bottom: none; }
  .sp-suggestion:hover, .sp-suggestion.active { background: #1a1a1a; }
  .sp-sug-descriptor {
    font-family: 'DM Mono', monospace; font-size: .75rem;
    letter-spacing: .08em; color: #6ee7a0; flex-shrink: 0;
  }
  .sp-sug-merchant { font-size: .7rem; color: #4b4b4b; }
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
    width: 56px; height: 56px; border-radius: 3px;
    object-fit: contain; background: #1a1a1a; flex-shrink: 0;
  }
  .sp-logo-placeholder {
    width: 56px; height: 56px; border-radius: 3px;
    background: #1a1a1a; border: 1px solid #1e1e1e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  }
  .sp-card-body { flex: 1; min-width: 0; }
  .sp-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: #6ee7a0; margin-bottom: .4rem;
  }
  .sp-merchant-name {
    font-family: 'DM Serif Display', serif; font-size: 1.3rem; margin-bottom: .3rem;
  }
  .sp-meta {
    font-size: .7rem; color: #4b4b4b;
    display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .5rem;
  }
  .sp-meta a { color: #6ee7a0; text-decoration: none; }
  .sp-meta a:hover { text-decoration: underline; }
  .sp-votes { font-size: .65rem; color: #4b4b4b; margin-top: .5rem; }
  .sp-card-action { margin-left: auto; flex-shrink: 0; align-self: center; }
  .sp-details-btn {
    padding: .55rem 1rem; border: 1px solid #1e1e1e; border-radius: 2px;
    background: none; color: #4b4b4b; font-family: 'DM Mono', monospace;
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s;
  }
  .sp-details-btn:hover { color: #f0ede6; border-color: #4b4b4b; }
  .sp-cotd {
    max-width: 600px; margin: 1.25rem auto 0;
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: .75rem 1.1rem; display: flex; align-items: center; gap: .75rem;
  }
  .sp-cotd-label {
    font-size: .58rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; white-space: nowrap;
  }
  .sp-cotd-divider { width: 1px; height: 1rem; background: #1e1e1e; flex-shrink: 0; }
  .sp-cotd-user {
    font-family: 'DM Mono', monospace; font-size: .75rem;
    color: #6ee7a0; letter-spacing: .04em;
  }
  .sp-cotd-count { font-size: .65rem; color: #2e2e2e; margin-left: auto; white-space: nowrap; }
`;

export default function SearchPage({ navigate }) {
  const { apiFetch } = useAuth();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState(null);
  const [busy, setBusy]             = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contributor, setContributor] = useState(undefined);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  useEffect(() => {
    fetch('/api/submissions/contributor-of-the-day')
      .then(r => r.json())
      .then(d => setContributor(d.contributor ?? null))
      .catch(() => setContributor(null));
  }, []);

  const search = useCallback(async (q = query) => {
    const term = q.trim();
    if (!term) return;
    setShowSuggestions(false);
    setSuggestions([]);
    setBusy(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }, [query]);

  // Debounced autocomplete
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggestions((data.results || []).length > 0);
        setActiveIdx(-1);
      } catch { /* ignore */ }
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickSuggestion = (descriptor) => {
    setQuery(descriptor);
    setSuggestions([]);
    setShowSuggestions(false);
    search(descriptor);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) { if (e.key === 'Enter') search(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); activeIdx >= 0 ? pickSuggestion(suggestions[activeIdx].descriptor) : search(); }
    else if (e.key === 'Escape') { setShowSuggestions(false); setActiveIdx(-1); }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-hero">
        <h1 className="sp-headline">Who <em>charged</em> me?</h1>
        <p className="sp-sub">
          Paste the billing descriptor from your bank statement to find out who really charged you.
        </p>
        <div className="sp-form-wrap" ref={wrapRef}>
          <div className="sp-form">
            <input
              ref={inputRef}
              className="sp-input"
              placeholder="e.g. SQ *COFFEE NYC or TST* RESTAURANT"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoFocus
            />
            <button className="sp-btn" onClick={() => search()} disabled={busy || !query.trim()}>
              {busy ? '…' : 'Look up'}
            </button>
          </div>

          {showSuggestions && (
            <div className="sp-suggestions">
              {suggestions.map((s, i) => (
                <div
                  key={s.descriptor}
                  className={`sp-suggestion${i === activeIdx ? ' active' : ''}`}
                  onMouseDown={() => pickSuggestion(s.descriptor)}
                >
                  <span className="sp-sug-descriptor">{s.descriptor}</span>
                  <span className="sp-sug-merchant">{s.merchant_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {contributor && (
          <div className="sp-cotd">
            <span className="sp-cotd-label">Contributor of the day</span>
            <span className="sp-cotd-divider" />
            <span className="sp-cotd-user">{contributor.username}</span>
            <span className="sp-cotd-count">{contributor.submission_count} submission{contributor.submission_count !== 1 ? 's' : ''}</span>
          </div>
        )}
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
            <>
              {results.map(r => (
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
                  <div className="sp-card-action">
                    <button
                      className="sp-details-btn"
                      onClick={() => {
                        apiFetch('/api/analytics/view', {
                          method: 'POST',
                          body: JSON.stringify({ descriptorId: r.descriptor_id }),
                        }).catch(() => {});
                        navigate('merchant', { merchant: r });
                      }}
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
              <p style={{ textAlign: 'center', fontSize: '.75rem', color: '#4b4b4b', marginTop: '1.5rem' }}>
                Not the right match?{' '}
                <span
                  style={{ color: '#6ee7a0', cursor: 'pointer' }}
                  onClick={() => navigate('submit', { descriptor: query })}
                >
                  Submit a new one →
                </span>
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
