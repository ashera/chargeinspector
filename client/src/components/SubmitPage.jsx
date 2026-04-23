import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .sub-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin-bottom: .5rem;
  }
  .sub-desc { font-size: .75rem; color: #4b4b4b; margin-bottom: 2rem; line-height: 1.6; }
  .sub-form { max-width: 520px; }
  .sub-field { margin-bottom: 1.25rem; }
  .sub-label {
    display: block;
    font-size: .6rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #4b4b4b;
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
  }
  .sub-input:focus { border-color: #6ee7a0; }
  .sub-input::placeholder { color: #2e2e2e; }
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
  .sub-conflict-meta { font-size: .7rem; color: #4b4b4b; }
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
    color: #4b4b4b;
    transition: color .2s, border-color .2s;
  }
  .sub-conflict-btn:hover { color: #f0ede6; border-color: #4b4b4b; }
  .sub-conflict-btn.primary { background: #6ee7a0; color: #0a0a0a; border-color: #6ee7a0; }
`;

const EMPTY = { descriptor: '', merchantName: '', merchantLocation: '', website: '', logoUrl: '' };

export default function SubmitPage({ navigate }) {
  const { apiFetch } = useAuth();
  const [form, setForm]         = useState(EMPTY);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [conflict, setConflict] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

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
      <h1 className="sub-title">Submit a match</h1>
      <p className="sub-desc">
        Know who's behind a confusing bank charge? Submit the billing descriptor and merchant
        details to help others identify it.
      </p>

      {conflict && (
        <div className="sub-conflict">
          <div className="sub-conflict-title">⚠ Existing match found</div>
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
        {[
          { key: 'descriptor',       label: 'Billing Descriptor',     placeholder: 'e.g. SQ *COFFEE NYC' },
          { key: 'merchantName',     label: 'Merchant Name',           placeholder: 'e.g. Blue Bottle Coffee' },
          { key: 'merchantLocation', label: 'Location (optional)',     placeholder: 'e.g. New York, NY' },
          { key: 'website',          label: 'Website (optional)',      placeholder: 'e.g. https://bluebottlecoffee.com' },
          { key: 'logoUrl',          label: 'Logo URL (optional)',     placeholder: 'e.g. https://example.com/logo.png' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="sub-field">
            <label className="sub-label">{label}</label>
            <input
              className="sub-input"
              placeholder={placeholder}
              value={form[key]}
              onChange={set(key)}
            />
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
