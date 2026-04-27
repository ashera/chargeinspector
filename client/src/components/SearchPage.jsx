import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { RANKS, getCurrentRank } from '../constants/ranks.js';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
  .sp-hero { text-align: center; padding: 3rem 0 2rem; }
  .sp-headline {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.1;
    margin-bottom: .75rem;
  }
  .sp-headline em { font-style: italic; color: var(--accent); }
  .sp-sub { font-size: .75rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem; }
  .sp-form-wrap { position: relative; max-width: 600px; margin: 0 auto; }
  .sp-form { display: flex; gap: .75rem; }
  .sp-input {
    flex: 1;
    padding: .85rem 1.1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--text);
    font-family: var(--font-ui);
    font-size: .85rem;
    outline: none;
    transition: border-color .2s;
  }
  .sp-input:focus { border-color: var(--accent); }
  .sp-input::placeholder { color: var(--text-dim); }
  .sp-btn {
    padding: .85rem 1.5rem;
    background: var(--accent);
    border: none;
    border-radius: 2px;
    font-family: var(--font-ui);
    font-size: .7rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--bg-page);
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
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 2px;
    z-index: 200;
    overflow: hidden;
  }
  .sp-suggestion {
    display: flex; align-items: baseline; gap: .75rem;
    padding: .7rem 1.1rem; cursor: pointer;
    border-bottom: 1px solid var(--bg-hover);
    transition: background .15s;
  }
  .sp-suggestion:last-child { border-bottom: none; }
  .sp-suggestion:hover, .sp-suggestion.active { background: var(--bg-hover); }
  .sp-sug-descriptor {
    font-family: var(--font-ui); font-size: .75rem;
    letter-spacing: .08em; color: var(--accent); flex-shrink: 0;
  }
  .sp-sug-merchant { font-size: .7rem; color: var(--text-muted); }
  .sp-results { margin-top: 2.5rem; }
  .sp-empty { text-align: center; color: var(--text-muted); font-size: .75rem; padding: 3rem 0; }
  .sp-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }
  .sp-logo {
    width: 56px; height: 56px; border-radius: 3px;
    object-fit: contain; background: var(--bg-hover); flex-shrink: 0;
  }
  .sp-logo-placeholder {
    width: 56px; height: 56px; border-radius: 3px;
    background: var(--bg-hover); border: 1px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  }
  .sp-card-body { flex: 1; min-width: 0; }
  .sp-descriptor {
    font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); margin-bottom: .4rem;
  }
  .sp-merchant-name {
    font-family: var(--font-display); font-size: 1.3rem; margin-bottom: .3rem;
  }
  .sp-meta {
    font-size: .7rem; color: var(--text-muted);
    display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .5rem;
  }
  .sp-meta a { color: var(--accent); text-decoration: none; }
  .sp-meta a:hover { text-decoration: underline; }
  .sp-votes { font-size: .65rem; color: var(--text-muted); margin-top: .5rem; display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
  .sp-confidence {
    display: inline-block; font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    padding: .15rem .5rem; border-radius: 2px;
  }
  .sp-confidence.high   { color: #4ade80; border: 1px solid #1e3a2a; background: #0d1a0f; }
  .sp-confidence.medium { color: #fbbf24; border: 1px solid #3a3010; background: #1a1608; }
  .sp-confidence.low    { color: var(--text-dim); border: 1px solid var(--border); }
  .sp-card-action { margin-left: auto; flex-shrink: 0; align-self: center; }
  .sp-details-btn {
    padding: .55rem 1rem; border: 1px solid var(--border); border-radius: 2px;
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s;
  }
  .sp-details-btn:hover { color: var(--text); border-color: var(--text-muted); }
  @media (max-width: 480px) {
    .sp-form { flex-direction: column; }
    .sp-btn { width: 100%; }
    .sp-card { flex-wrap: wrap; gap: 1rem; }
    .sp-card-action { width: 100%; margin-left: 0; }
    .sp-details-btn { width: 100%; text-align: center; }
  }
  .sp-modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,.8);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .sp-modal {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 4px;
    padding: 2rem; max-width: 400px; width: 100%; text-align: center;
  }
  .sp-modal-title {
    font-family: var(--font-display); font-style: italic;
    font-size: 1.6rem; color: var(--accent); margin-bottom: .6rem; line-height: 1.1;
  }
  .sp-modal-eyebrow {
    font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .85rem;
  }
  .sp-modal-descriptor {
    font-family: var(--font-ui); font-size: .75rem;
    color: var(--amber); letter-spacing: .08em; margin-bottom: 1.25rem;
  }
  .sp-modal-body {
    font-size: .78rem; color: #8a8a8a; line-height: 1.7; margin-bottom: 1.5rem;
  }
  .sp-modal-btn {
    width: 100%; padding: .85rem; background: var(--accent);
    border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .7rem;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--bg-page); font-weight: 500; cursor: pointer; margin-bottom: .75rem;
  }
  .sp-modal-btn:disabled { opacity: .4; cursor: not-allowed; }
  .sp-modal-dismiss {
    display: block; width: 100%; background: none; border: none;
    font-family: var(--font-ui); font-size: .6rem;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; text-align: center; padding: .5rem 0;
  }
  .sp-modal-dismiss:hover { color: var(--text); }
  .sp-rank-bar {
    max-width: 600px; margin: 2.5rem auto 0;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .65rem;
  }
  .sp-rank-tagline { font-size: .72rem; color: var(--text-muted); }

  .sp-cta-card {
    max-width: 600px; margin: 2.5rem auto 0;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem; display: flex; flex-direction: column; gap: .75rem;
    text-align: center; align-items: center;
  }
  .sp-cta-title { font-family: var(--font-display); font-size: 1.1rem; color: var(--text); }
  .sp-cta-body  { font-size: .75rem; color: var(--text-muted); line-height: 1.6; }
  .sp-cta-btn {
    padding: .65rem 1.5rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500;
    cursor: pointer; transition: opacity .2s;
  }
  .sp-cta-btn:hover { opacity: .85; }
  .sp-rank-row { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
  .sp-rank-name { font-size: .8rem; color: var(--text); }
  .sp-rank-icon { font-size: 1rem; margin-right: .3rem; }
  .sp-rank-next { font-size: .68rem; color: var(--text-muted); }
  .sp-rank-next strong { color: var(--accent); }
  .sp-rank-track {
    height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;
  }
  .sp-rank-fill {
    height: 100%; background: var(--accent); border-radius: 2px;
    transition: width .4s ease;
  }
  .sp-rank-maxed { font-size: .7rem; color: var(--accent); }

  @keyframes cotd-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(240,180,41,.18), 0 0 18px 0 rgba(240,180,41,.06); }
    50%       { box-shadow: 0 0 0 4px rgba(240,180,41,.06), 0 0 32px 4px rgba(240,180,41,.14); }
  }
  @keyframes cotd-scan {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(200%); }
  }
  .sp-cotd {
    max-width: 600px; margin: 0 auto 1.5rem;
    background: linear-gradient(160deg, #141008 0%, var(--bg-card) 60%);
    border: 1px solid var(--amber);
    border-radius: 4px;
    padding: .55rem 1rem;
    display: flex; align-items: center; gap: .65rem;
    position: relative; overflow: hidden;
    animation: cotd-pulse 3s ease-in-out infinite;
  }
  .sp-cotd-crown { font-size: .95rem; flex-shrink: 0; line-height: 1; }
  .sp-cotd-label {
    font-size: .55rem; letter-spacing: .16em; text-transform: uppercase;
    color: #9a6f10; white-space: nowrap; flex-shrink: 0;
  }
  .sp-cotd-divider { width: 1px; height: .75rem; background: #3a2a08; flex-shrink: 0; }
  .sp-cotd-user {
    font-family: var(--font-ui); font-size: .75rem;
    color: var(--amber); letter-spacing: .04em;
  }
  .sp-cotd-count {
    font-size: .6rem; color: #6a5018; letter-spacing: .08em;
    text-transform: uppercase; margin-left: auto; white-space: nowrap;
  }
`;

export default function SearchPage({ navigate }) {
  useMeta({ title: 'Identify Any Credit Card Charge', description: 'Unknown charge on your bank statement? Search our community database of billing descriptors to find out who really charged you.' });
  const { apiFetch, isAuthenticated, user } = useAuth();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState(null);
  const [busy, setBusy]             = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contributor, setContributor]   = useState(undefined);
  const [showModal, setShowModal]       = useState(false);
  const [existingCase, setExistingCase] = useState(null);
  const [caseCreating, setCaseCreating] = useState(false);
  const inputRef       = useRef(null);
  const debounceRef    = useRef(null);
  const wrapRef        = useRef(null);
  const suppressACRef  = useRef(false);

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
    setShowModal(false);
    setExistingCase(null);
    setBusy(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results);
      if (data.results.length === 0) {
        const lookupRes = await fetch(`/api/cases/lookup?descriptor=${encodeURIComponent(term)}`);
        const lookupData = await lookupRes.json();
        setExistingCase(lookupData.case ?? null);
        setShowModal(true);
      }
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }, [query]);

  const handleInvestigate = async () => {
    setCaseCreating(true);
    try {
      const res  = await apiFetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify({ descriptor: query }),
      });
      const data = await res.json();
      if (res.ok && data.case) {
        setShowModal(false);
        navigate('case', { caseData: data.case });
      }
    } catch { /* ignore */ } finally {
      setCaseCreating(false);
    }
  };

  // Debounced autocomplete
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (suppressACRef.current) { suppressACRef.current = false; return; }
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
    suppressACRef.current = true;
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
      {contributor && (
        <div className="sp-cotd">
          <span className="sp-cotd-crown">&#x1F451;</span>
          <span className="sp-cotd-label">Contributor of the day</span>
          <span className="sp-cotd-divider" />
          <span className="sp-cotd-user">{contributor.username}</span>
          <span className="sp-cotd-count">{contributor.submission_count} submission{contributor.submission_count !== 1 ? 's' : ''}</span>
        </div>
      )}
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
              onChange={e => setQuery(e.target.value.toUpperCase())}
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
      </div>

      {results !== null && (
        <div className="sp-results">
          {results.length === 0 ? null : (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '.35rem' }}>
                  Mystery solved!
                </p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  The following merchant{results.length !== 1 ? 's match' : ' matches'} that descriptor. Click <strong style={{ color: 'var(--text)' }}>View Details</strong> to see more information about the merchant.
                </p>
              </div>
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
                    <div className="sp-votes">
                      <span>{r.upvote_count} confirmation{r.upvote_count !== 1 ? 's' : ''}</span>
                      {r.confidence && (
                        <span className={`sp-confidence ${r.confidence}`}>{r.confidence} confidence</span>
                      )}
                    </div>
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
              <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                Not the right match?{' '}
                <span
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={handleInvestigate}
                >
                  Check the case file →
                </span>
              </p>
            </>
          )}
        </div>
      )}
      {showModal && (
        <div className="sp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="sp-modal">
            <div className="sp-modal-title">{existingCase ? 'Open Investigation' : 'New Mystery Identified!'}</div>
            <div className="sp-modal-eyebrow">Unidentified descriptor</div>
            <div className="sp-modal-descriptor">"{query}"</div>
            <div className="sp-modal-body">
              {existingCase
                ? 'We have an open case to try and solve this mystery, would you like to help investigate?'
                : "We don't recognise this descriptor! Would you like to help solve the mystery?"}
            </div>
            <button className="sp-modal-btn" onClick={handleInvestigate} disabled={caseCreating}>
              {caseCreating
                ? 'Opening case…'
                : existingCase
                  ? `Join the Investigation — Case #${existingCase.id.slice(0, 8).toUpperCase()}`
                  : 'Investigate'}
            </button>
            <button className="sp-modal-dismiss" onClick={() => setShowModal(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="sp-cta-card">
          <div className="sp-cta-title">Join the investigation</div>
          <div className="sp-cta-body">
            Create a free account to help identify mystery charges, earn points, and climb the ranks.
            Every merchant you crack helps the whole community.
          </div>
          <button className="sp-cta-btn" onClick={() => navigate('register')}>Create free account →</button>
        </div>
      )}

      {isAuthenticated && user && (() => {
        const pts      = user.total_points ?? 0;
        const rank     = getCurrentRank(pts);
        const nextRank = RANKS.find(r => r.threshold > pts) ?? null;
        const pct      = nextRank
          ? Math.min(100, Math.round(((pts - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100))
          : 100;
        return (
          <div className="sp-rank-bar">
            <div className="sp-rank-tagline">Identify merchants to earn points and increase your rank!</div>
            <div className="sp-rank-row">
              <span className="sp-rank-name">
                <span className="sp-rank-icon">{rank.icon}</span>{rank.name}
              </span>
              {nextRank
                ? <span className="sp-rank-next"><strong>{nextRank.threshold - pts} pts</strong> to {nextRank.icon} {nextRank.name}</span>
                : <span className="sp-rank-maxed">Max rank reached</span>
              }
            </div>
            <div className="sp-rank-track">
              <div className="sp-rank-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })()}
    </>
  );
}
