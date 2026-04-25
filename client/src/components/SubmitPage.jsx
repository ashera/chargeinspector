import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .sub-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin-bottom: .5rem;
  }
  .sub-desc { font-size: .75rem; color: #888; margin-bottom: 2rem; line-height: 1.6; }
  .sub-form { max-width: 520px; }
  .sub-field { margin-bottom: 1.25rem; position: relative; }
  .sub-label {
    display: block;
    font-size: .6rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: .5rem;
  }
  .sub-input {
    width: 100%;
    padding: .75rem 1rem;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 2px;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    font-size: .8rem;
    outline: none;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  .sub-input:focus { border-color: #6ee7a0; }
  .sub-input::placeholder { color: #4b4b4b; }
  .sub-btn {
    width: 100%;
    padding: .85rem;
    background: #6ee7a0;
    border: none;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: .7rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #0a0a0a;
    font-weight: 500;
    cursor: pointer;
    margin-top: .5rem;
  }
  .sub-btn:disabled { opacity: .4; cursor: not-allowed; }
  .sub-error { font-size: .7rem; color: #e05c5c; margin-top: 1rem; }
  .sub-success { font-size: .75rem; color: #6ee7a0; margin-top: 1rem; line-height: 1.6; }
  .sub-conflict {
    background: #111;
    border: 1px solid #2e2e2e;
    border-radius: 3px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .sub-conflict-title { font-size: .65rem; letter-spacing: .14em; text-transform: uppercase; color: #e0c05c; margin-bottom: .75rem; }
  .sub-conflict-merchant { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: .25rem; }
  .sub-conflict-meta { font-size: .7rem; color: #888; }
  .sub-conflict-btns { display: flex; gap: .75rem; margin-top: 1rem; }
  .sub-conflict-btn {
    flex: 1;
    padding: .7rem;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: .65rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid #1e1e1e;
    background: none;
    color: #888;
    transition: color .2s, border-color .2s;
  }
  .sub-conflict-btn:hover { color: #f0ede6; border-color: #888; }
  .sub-conflict-btn.primary { background: #6ee7a0; color: #0a0a0a; border-color: #6ee7a0; }
  .sub-suggestions {
    position: absolute;
    top: 100%;
    left: 0; right: 0;
    background: #111;
    border: 1px solid #1e1e1e;
    border-top: none;
    border-radius: 0 0 2px 2px;
    z-index: 200;
    overflow: hidden;
  }
  .sub-suggestion {
    padding: .65rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid #1a1a1a;
    transition: background .15s;
  }
  .sub-suggestion:last-child { border-bottom: none; }
  .sub-suggestion:hover, .sub-suggestion.active { background: #1a1a1a; }
  .sub-sug-name { font-size: .8rem; color: #f0ede6; }
  .sub-sug-meta { font-size: .65rem; color: #888; margin-top: .1rem; }
`;

const EMPTY = { descriptor: '', merchantName: '', merchantLocation: '', website: '', logoUrl: '' };

export default function SubmitPage({ navigate, initialDescriptor }) {
  const { apiFetch } = useAuth();
  const [form, setForm]         = useState({ ...EMPTY, descriptor: initialDescriptor });
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [conflict, setConflict] = useState(null);

  const [suggestions, setSuggestions]   = useState([]);
  const [activeIdx, setActiveIdx]       = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const fieldRef    = useRef(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Merchant name autocomplete
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = form.merchantName.trim();
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/merchants/autocomplete?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggestions((data.results || []).length > 0);
        setActiveIdx(-1);
      } catch { /* ignore */ }
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [form.merchantName]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (fieldRef.current && !fieldRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickMerchant = (m) => {
    setForm(f => ({
      ...f,
      merchantName:     m.name,
      merchantLocation: m.location || '',
      website:          m.website  || '',
      logoUrl:          m.logo_url || '',
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMerchantKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pickMerchant(suggestions[activeIdx]); }
    else if (e.key === 'Escape') { setShowSuggestions(false); setActiveIdx(-1); }
  };

  const submit = async (forceConflict = false) => {
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const url  = forceConflict ? '/api/submissions/conflict' : '/api/submissions';
      const res  = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok && data.duplicate) {
        setSuccess('This merchant is already on file for this descriptor.');
        setForm(EMPTY);
        setConflict(null);
        return;
      }
      if (res.status === 409 && data.conflict) {
        setConflict(data.existing);
        setBusy(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setBusy(false);
        return;
      }

      setSuccess('Submission received! It will appear in search results once approved.');
      setForm(EMPTY);
      setConflict(null);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <h1 className="sub-title">Submit a new billing descriptor</h1>
      <p className="sub-desc">
        Know who's behind a confusing bank charge? Submit the billing descriptor and merchant
        details to help others identify it.
      </p>

      {conflict && (
        <div className="sub-conflict">
          <div className="sub-conflict-title">⚠ A similar merchant already exists</div>
          <div className="sub-conflict-merchant">{conflict.name}</div>
          <div className="sub-conflict-meta">
            {conflict.location && <span>📍 {conflict.location} · </span>}
            {conflict.website  && <span>🌐 {conflict.website}</span>}
          </div>
          <div className="sub-conflict-btns">
            <button className="sub-conflict-btn" onClick={() => setConflict(null)}>
              Cancel
            </button>
            <button className="sub-conflict-btn primary" onClick={() => submit(true)}>
              Mine is different — submit anyway
            </button>
          </div>
        </div>
      )}

      <div className="sub-form">
        {/* Descriptor */}
        <div className="sub-field">
          <label className="sub-label">Billing Descriptor</label>
          <input className="sub-input" placeholder="e.g. SQ *COFFEE NYC" value={form.descriptor} onChange={set('descriptor')} />
        </div>

        {/* Merchant Name with typeahead */}
        <div className="sub-field" ref={fieldRef}>
          <label className="sub-label">Merchant Name</label>
          <input
            className="sub-input"
            placeholder="e.g. Blue Bottle Coffee"
            value={form.merchantName}
            onChange={set('merchantName')}
            onKeyDown={handleMerchantKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="sub-suggestions">
              {suggestions.map((m, i) => (
                <div
                  key={m.id}
                  className={`sub-suggestion${i === activeIdx ? ' active' : ''}`}
                  onMouseDown={() => pickMerchant(m)}
                >
                  <div className="sub-sug-name">{m.name}</div>
                  {(m.location || m.website) && (
                    <div className="sub-sug-meta">
                      {m.location && `📍 ${m.location}`}
                      {m.location && m.website && ' · '}
                      {m.website  && `🌐 ${m.website}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remaining fields */}
        {[
          { key: 'merchantLocation', label: 'Location (optional)',  placeholder: 'e.g. New York, NY' },
          { key: 'website',          label: 'Website (optional)',   placeholder: 'e.g. https://bluebottlecoffee.com' },
          { key: 'logoUrl',          label: 'Logo URL (optional)',  placeholder: 'e.g. https://example.com/logo.png' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="sub-field">
            <label className="sub-label">{label}</label>
            <input className="sub-input" placeholder={placeholder} value={form[key]} onChange={set(key)} />
          </div>
        ))}

        <button
          className="sub-btn"
          onClick={() => submit(false)}
          disabled={busy || !form.descriptor.trim() || !form.merchantName.trim()}
        >
          {busy ? 'Submitting…' : 'Submit match'}
        </button>

        {error   && <p className="sub-error">{error}</p>}
        {success && <p className="sub-success">✓ {success}</p>}
      </div>
    </>
  );
}
