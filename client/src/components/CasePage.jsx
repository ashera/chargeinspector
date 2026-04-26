import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getCurrentRank } from '../constants/ranks.js';

const PRESET_MAP = {
  'preset:detective':  { emoji: '🕵️', bg: '#0f1f3a' },
  'preset:magnifier':  { emoji: '🔍', bg: '#1a3a2a' },
  'preset:fedora':     { emoji: '🎩', bg: '#1a1a2a' },
  'preset:dagger':     { emoji: '🗡️', bg: '#3a1010' },
  'preset:file':       { emoji: '📋', bg: '#0a2a3a' },
  'preset:candle':     { emoji: '🕯️', bg: '#2a1a08' },
  'preset:lock':       { emoji: '🔐', bg: '#1a2a1a' },
  'preset:map':        { emoji: '🗺️', bg: '#2a2010' },
  'preset:phone':      { emoji: '📞', bg: '#0a2a2a' },
  'preset:briefcase':  { emoji: '💼', bg: '#2a152a' },
  'preset:flashlight': { emoji: '🔦', bg: '#0a0f2a' },
  'preset:skull':      { emoji: '💀', bg: '#2a0a0a' },
};

const STEPS = [
  {
    key: 'web_intelligence', icon: '🌐', label: 'Web Intelligence', manual: false,
    desc: 'Inspector Lestrade will search the open web and public records for intelligence on this descriptor.',
    agent: {
      name: 'Inspector Lestrade',
      division: 'Web Intelligence Division',
      loadingLabel: 'Inspector Lestrade is on the case…',
      loadingSub: 'Combing through official records and web intelligence',
    },
  },
  { key: 'local_knowledge', icon: '🗣️', label: 'Local Knowledge', manual: true,
    desc: 'Enter what you know about this merchant directly.' },
];

const CSS = `
  .cp-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0; margin-bottom: 2rem; display: inline-block;
  }
  .cp-back:hover { color: var(--text); }

  .cp-top { display: flex; gap: 2rem; align-items: flex-start; margin-bottom: 1.5rem; }
  .cp-top-left { flex: 1; min-width: 0; }
  .cp-eyebrow {
    font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .3rem;
  }
  .cp-ref {
    font-family: var(--font-ui); font-size: .65rem;
    color: var(--text-dim); letter-spacing: .12em; margin-bottom: 1.25rem;
  }
  .cp-descriptor {
    font-family: var(--font-ui); font-size: 1.5rem;
    color: var(--amber); letter-spacing: .08em; margin-bottom: 1.25rem; line-height: 1.2;
  }
  .cp-status-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .cp-status {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    padding: .3rem .75rem; border-radius: 2px;
  }
  .cp-status.open          { color: var(--warning); border: 1px solid #3a3010; background: #1a1608; }
  .cp-status.investigating { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-status.solved        { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-date { font-size: .65rem; color: var(--text-dim); }

  .cp-team {
    flex-shrink: 0; text-align: right;
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; min-width: 160px;
  }
  .cp-team-label {
    font-size: .55rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .85rem;
  }
  .cp-detective {
    display: flex; align-items: center; justify-content: flex-end;
    gap: .6rem; margin-bottom: .65rem;
  }
  .cp-detective:last-child { margin-bottom: 0; }
  .cp-detective-info { display: flex; flex-direction: column; align-items: flex-end; gap: .1rem; }
  .cp-detective-rank { font-size: .62rem; color: var(--text-muted); }
  .cp-detective-name { font-size: .7rem; color: var(--text); }
  .cp-detective-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--border); border: 1px solid var(--border-subtle);
    display: flex; align-items: center; justify-content: center;
    font-size: .85rem; color: var(--text-muted); flex-shrink: 0;
    text-transform: uppercase; font-family: var(--font-ui); overflow: hidden;
  }
  .cp-detective-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .cp-team-empty { font-size: .65rem; color: var(--text-dim); }

  .cp-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.5rem; margin-bottom: 1.5rem;
  }
  .cp-card-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .75rem;
  }
  .cp-card-body { font-size: .8rem; color: var(--text-muted); line-height: 1.7; }

  /* Investigation Steps */
  .cp-steps-header {
    display: flex; align-items: baseline; gap: .75rem; margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border); padding-bottom: .5rem;
  }
  .cp-steps-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-muted);
  }

  .cp-steps { display: flex; flex-direction: column; gap: 0; margin-bottom: 1.5rem; }
  .cp-step {
    border: 1px solid var(--border); border-radius: 3px; overflow: hidden;
    margin-bottom: .75rem; transition: border-color .2s;
  }
  .cp-step.has-data { border-color: var(--border-subtle); }
  .cp-step.locked   { opacity: .45; pointer-events: none; }

  .cp-step-header {
    display: flex; align-items: center; gap: .85rem;
    padding: .9rem 1.1rem; background: var(--bg-card); border-bottom: 1px solid var(--border);
  }
  .cp-step.has-data .cp-step-header { border-bottom-color: var(--border-subtle); }
  .cp-step-num {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: var(--border); border: 1px solid var(--border-subtle);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-ui); font-size: .6rem; color: var(--text-dim);
  }
  .cp-step.has-data .cp-step-num { background: #1e3a2a; border-color: var(--accent); color: var(--accent); }
  .cp-step-icon { font-size: 1rem; line-height: 1; }
  .cp-step-label {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); flex: 1;
  }
  .cp-step.has-data .cp-step-label { color: var(--text); }
  .cp-step-lock {
    font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-dim); padding: .2rem .5rem; border: 1px solid var(--border); border-radius: 2px;
  }
  .cp-step-done {
    font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--accent); padding: .2rem .5rem; border: 1px solid #1e3a2a;
    border-radius: 2px; background: #0d1a0f;
  }
  .cp-step-label-wrap { display: flex; flex-direction: column; gap: .15rem; flex: 1; }
  .cp-step-sublabel {
    font-size: .55rem; letter-spacing: .08em; color: var(--text-dim); line-height: 1;
  }
  .cp-agent-filed {
    display: inline-block; margin-top: .65rem;
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-dim); border-top: 1px solid var(--bg-card); padding-top: .5rem; width: 100%;
  }

  .cp-step-body { padding: 1.1rem 1.25rem; }

  .cp-step-desc { font-size: .75rem; color: var(--text-muted); line-height: 1.6; margin-bottom: .85rem; }

  .cp-collect-btn {
    padding: .55rem 1.1rem; border: 1px solid var(--border); border-radius: 2px;
    background: none; font-family: var(--font-ui); font-size: .62rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
  }
  .cp-collect-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .cp-collect-btn:disabled { opacity: .5; cursor: default; }
  .cp-collecting {
    font-size: .65rem; color: var(--accent); margin-top: .6rem; letter-spacing: .04em; display: block;
  }

  /* Evidence results */
  .cp-result-merchant { font-size: .9rem; color: var(--text); font-weight: 500; margin-bottom: .3rem; }
  .cp-result-unknown  { font-size: .8rem; color: var(--text-dim); font-style: italic; margin-bottom: .3rem; }
  .cp-confidence {
    display: inline-block; font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    padding: .15rem .5rem; border-radius: 2px; margin-bottom: .35rem;
  }
  .cp-confidence.high   { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-confidence.medium { color: var(--warning); border: 1px solid #3a3010; background: #1a1608; }
  .cp-confidence.low    { color: var(--text-dim); border: 1px solid var(--border); }
  .cp-result-btype  { font-size: .65rem; color: var(--text-dim); margin-bottom: .55rem; }
  .cp-result-desc   { font-size: .72rem; color: var(--text-muted); line-height: 1.6; margin-bottom: .65rem; }
  .cp-result-sources { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .85rem; }
  .cp-result-source {
    font-size: .62rem; color: var(--accent); text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cp-result-source:hover { text-decoration: underline; }

  .cp-step-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; margin-top: .85rem; padding-top: .85rem; border-top: 1px solid var(--border); }
  .cp-solve-btn {
    padding: .6rem 1.25rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-solve-btn:hover { opacity: .9; }
  .cp-next-btn {
    padding: .6rem 1.1rem; background: none; border: 1px solid var(--border); border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
  }
  .cp-next-btn:hover { border-color: var(--text-muted); color: var(--text); }
  .cp-recollect-btn {
    background: none; border: none; font-family: var(--font-ui); font-size: .6rem;
    letter-spacing: .08em; text-transform: uppercase; color: var(--text-dim); cursor: pointer;
    padding: 0; margin-left: auto;
  }
  .cp-recollect-btn:hover { color: var(--text-muted); }
  .cp-step-error { font-size: .65rem; color: #e05; margin-top: .4rem; display: block; }
  .cp-sign-in-note { font-size: .65rem; color: var(--text-dim); font-style: italic; }

  /* Agent loading animation */
  @keyframes cp-ping {
    0%   { transform: scale(.25); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes cp-blink {
    0%, 100% { opacity: 1; } 50% { opacity: .3; }
  }
  .cp-loader {
    display: flex; align-items: center; gap: 1.25rem;
    padding: .75rem 0 .5rem;
  }
  .cp-loader-radar {
    position: relative; width: 38px; height: 38px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .cp-loader-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1.5px solid var(--accent); opacity: 0;
    animation: cp-ping 2s ease-out infinite;
  }
  .cp-loader-ring:nth-child(2) { animation-delay: .65s; }
  .cp-loader-ring:nth-child(3) { animation-delay: 1.3s; }
  .cp-loader-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
    position: relative; z-index: 1;
    animation: cp-blink 1.4s ease-in-out infinite;
  }
  .cp-loader-label { font-size: .72rem; color: var(--text-muted); letter-spacing: .03em; }
  .cp-loader-sub   { font-size: .62rem; color: var(--text-dim);   margin-top: .2rem; }

  /* Local Knowledge form */
  .cp-lk-form { display: flex; flex-direction: column; gap: .75rem; }
  .cp-lk-field { display: flex; flex-direction: column; gap: .3rem; }
  .cp-lk-label {
    font-size: .58rem; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted);
  }
  .cp-lk-input, .cp-lk-textarea, .cp-lk-select {
    background: var(--bg-page); border: 1px solid var(--border); border-radius: 2px;
    color: var(--text); font-family: var(--font-ui); font-size: .78rem;
    padding: .55rem .75rem; outline: none; transition: border-color .2s;
  }
  .cp-lk-input:focus, .cp-lk-textarea:focus, .cp-lk-select:focus { border-color: var(--accent); }
  .cp-lk-input::placeholder, .cp-lk-textarea::placeholder { color: var(--text-dim); }
  .cp-lk-textarea { resize: vertical; min-height: 72px; }
  .cp-lk-select { cursor: pointer; }
  .cp-lk-submit {
    align-self: flex-start; padding: .55rem 1.25rem;
    background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-lk-submit:hover { opacity: .9; }
  .cp-lk-submit:disabled { opacity: .45; cursor: default; }

  /* Confirmation modal */
  .cp-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 1rem;
  }
  .cp-modal {
    background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 4px;
    width: 100%; max-width: 440px; padding: 1.75rem;
  }
  .cp-modal-eyebrow {
    font-size: .55rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .6rem;
  }
  .cp-modal-merchant {
    font-family: var(--font-display); font-size: 1.4rem; color: var(--text);
    margin-bottom: .5rem; line-height: 1.2;
  }
  .cp-modal-unknown {
    font-size: 1rem; color: var(--text-dim); font-style: italic; margin-bottom: .5rem;
  }
  .cp-modal-row { display: flex; align-items: center; gap: .6rem; margin-bottom: .5rem; flex-wrap: wrap; }
  .cp-modal-btype { font-size: .75rem; color: var(--text-dim); }
  .cp-modal-desc {
    font-size: .75rem; color: var(--text-muted); line-height: 1.6;
    margin: .75rem 0; padding-top: .75rem; border-top: 1px solid var(--border);
  }
  .cp-modal-actions { display: flex; gap: .75rem; margin-top: 1.25rem; }
  .cp-modal-confirm {
    flex: 1; padding: .7rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-modal-confirm:hover { opacity: .9; }
  .cp-modal-confirm:disabled { opacity: .45; cursor: default; }
  .cp-modal-cancel {
    padding: .7rem 1.25rem; background: none; border: 1px solid var(--border); border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
  }
  .cp-modal-cancel:hover { border-color: var(--text-muted); color: var(--text); }

  .cp-success-banner {
    background: #0d1a0f; border: 1px solid #1e3a2a; border-radius: 3px;
    padding: 1rem 1.25rem; margin-bottom: 1.5rem;
    font-size: .78rem; color: #4ade80; line-height: 1.6;
  }
  .cp-pending-msg {
    margin-top: 1rem; padding: .85rem 1rem; border-radius: 3px;
    background: #1a1608; border: 1px solid #3a3010;
    font-size: .72rem; color: var(--warning); line-height: 1.6;
  }

  /* Submit button */
  .cp-submit-btn {
    padding: .85rem 1.75rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .7rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-submit-btn:hover { opacity: .9; }

  @media (max-width: 540px) {
    .cp-top { flex-direction: column-reverse; }
    .cp-team { text-align: left; min-width: 0; width: 100%; }
    .cp-detective { justify-content: flex-start; }
    .cp-detective-info { align-items: flex-start; }
  }
`;

const STATUS_LABEL = { open: 'Open', investigating: 'Investigating', solved: 'Solved' };

function EvidenceResults({ ev }) {
  return (
    <>
      {ev.merchant_name
        ? <div className="cp-result-merchant">{ev.merchant_name}</div>
        : <div className="cp-result-unknown">Merchant not identified</div>
      }
      {ev.confidence && (
        <span className={`cp-confidence ${ev.confidence}`}>{ev.confidence} confidence</span>
      )}
      {ev.business_type && <div className="cp-result-btype">{ev.business_type}</div>}
      {ev.description   && <div className="cp-result-desc">{ev.description}</div>}
      {Array.isArray(ev.sources) && ev.sources.length > 0 && (
        <div className="cp-result-sources">
          {ev.sources.slice(0, 3).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="cp-result-source">
              {s.title || s.url}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function ConfirmModal({ modal, onConfirm, onCancel, confirming, error }) {
  const d = modal.data;
  return (
    <div className="cp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="cp-modal">
        <div className="cp-modal-eyebrow">Confirm merchant identification</div>
        {d.merchant_name
          ? <div className="cp-modal-merchant">{d.merchant_name}</div>
          : <div className="cp-modal-unknown">Merchant not identified</div>
        }
        {d.confidence && (
          <div style={{ marginBottom: '.75rem' }}>
            <span className={`cp-confidence ${d.confidence}`}>{d.confidence} confidence</span>
          </div>
        )}
        <div className="cp-modal-desc">
          Only confirm and solve the case if you are confident that these are the most likely merchant
          details based on the evidence. When you confirm, these details will be reviewed by our
          moderation team and then added to our community database for others to see when searching
          for a descriptor.
        </div>
        {error && <div style={{ fontSize: '.7rem', color: '#e05', marginTop: '.75rem' }}>{error}</div>}
        <div className="cp-modal-actions">
          <button className="cp-modal-cancel" onClick={onCancel} disabled={confirming}>Cancel</button>
          <button className="cp-modal-confirm" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Solving…' : 'Confirm & solve case →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LocalKnowledgeForm({ onSubmit, submitting, label }) {
  const [form, setForm] = useState({ merchant_name: '', business_type: '', description: '', confidence: 'medium' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="cp-lk-form">
      <div className="cp-lk-field">
        <label className="cp-lk-label">Merchant name <span style={{ color: 'var(--accent)' }}>*</span></label>
        <input className="cp-lk-input" placeholder="e.g. Blue Bottle Coffee" value={form.merchant_name} onChange={set('merchant_name')} />
      </div>
      <div className="cp-lk-field">
        <label className="cp-lk-label">Business type</label>
        <input className="cp-lk-input" placeholder="e.g. Coffee chain, SaaS subscription" value={form.business_type} onChange={set('business_type')} />
      </div>
      <div className="cp-lk-field">
        <label className="cp-lk-label">Notes</label>
        <textarea className="cp-lk-textarea" placeholder="Any additional context or details you know about this charge…" value={form.description} onChange={set('description')} />
      </div>
      <div className="cp-lk-field">
        <label className="cp-lk-label">Confidence</label>
        <select className="cp-lk-select" value={form.confidence} onChange={set('confidence')}>
          <option value="high">High — I am certain</option>
          <option value="medium">Medium — I am fairly sure</option>
          <option value="low">Low — just a guess</option>
        </select>
      </div>
      <button
        className="cp-lk-submit"
        onClick={() => onSubmit(form)}
        disabled={submitting || !form.merchant_name.trim()}
      >
        {submitting ? 'Collecting…' : 'Accept & solve case →'}
      </button>
    </div>
  );
}

export default function CasePage({ caseData: initialData, navigate }) {
  const { apiFetch, isAuthenticated } = useAuth();
  const [data, setData]       = useState(initialData);
  const [evidence, setEvidence] = useState({});   // { type: most-recent-row }
  const [collecting, setCollecting] = useState(null);
  const [errors, setErrors]     = useState({});
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null); // { data, formData|null }
  const [solveError, setSolveError]   = useState(null);
  const [solving, setSolving]         = useState(false);
  const [solveSuccess, setSolveSuccess] = useState(false);
  const [pendingModeration, setPendingModeration] = useState(!!initialData.pending_submission_id);

  useEffect(() => {
    fetch(`/api/cases/${initialData.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.case) {
          setData(d.case);
          if (d.case.pending_submission_id) setPendingModeration(true);
        }
      })
      .catch(() => {});
  }, [initialData.id]);

  useEffect(() => {
    fetch(`/api/cases/${initialData.id}/evidence`)
      .then(r => r.json())
      .then(d => {
        const map = {};
        for (const row of (d.evidence || [])) {
          if (!map[row.type]) map[row.type] = row; // already DESC, first = newest
        }
        setEvidence(map);
        // Open up to the last step that already has evidence
        const lastDone = STEPS.reduce((acc, s, i) => (map[s.key] ? i : acc), 0);
        setActiveStepIdx(lastDone);
      })
      .catch(() => {});
  }, [initialData.id]);

  async function collect(type, extra = {}) {
    setCollecting(type);
    setErrors(e => ({ ...e, [type]: null }));
    try {
      const res  = await apiFetch(`/api/cases/${initialData.id}/evidence/collect`, {
        method: 'POST',
        body: JSON.stringify({ type, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Collection failed');
      setEvidence(ev => ({ ...ev, [type]: data.evidence }));
    } catch (err) {
      setErrors(e => ({ ...e, [type]: err.message }));
    } finally {
      setCollecting(null);
    }
  }

  function openConfirm(type, formData = null) {
    const ev = formData
      ? { merchant_name: formData.merchant_name, confidence: formData.confidence, business_type: formData.business_type, description: formData.description }
      : evidence[type];
    setConfirmModal({ type, data: ev || {}, formData });
  }

  async function handleConfirm() {
    const { type, data: modalData, formData } = confirmModal;
    setSolveError(null);
    setSolving(true);

    try {
      // Save Local Knowledge evidence first if it hasn't been stored yet
      if (formData) {
        setCollecting(type);
        setErrors(e => ({ ...e, [type]: null }));
        const evRes  = await apiFetch(`/api/cases/${initialData.id}/evidence/collect`, {
          method: 'POST',
          body: JSON.stringify({ type, ...formData }),
        });
        const evBody = await evRes.json();
        if (!evRes.ok) throw new Error(evBody.error || 'Failed to save evidence');
        setEvidence(ev => ({ ...ev, [type]: evBody.evidence }));
        setCollecting(null);
      }

      // Submit the match
      const subRes  = await apiFetch('/api/submissions/case-solve', {
        method: 'POST',
        body: JSON.stringify({ descriptor: data.descriptor, merchantName: modalData.merchant_name, evidenceType: type }),
      });
      const subBody = await subRes.json();
      if (!subRes.ok) throw new Error(subBody.error || 'Failed to submit match');

      setConfirmModal(null);

      if (subBody.approved) {
        // Auto-approved — reload case so it transitions to solved
        const caseRes  = await fetch(`/api/cases/${initialData.id}`);
        const caseBody = await caseRes.json();
        if (caseBody.case) setData(caseBody.case);
      } else {
        // Pending moderation — set client state immediately, then reload for DB-side pending_submission_id
        setPendingModeration(true);
        setSolveSuccess(true);
        const caseRes  = await fetch(`/api/cases/${initialData.id}`);
        const caseBody = await caseRes.json();
        if (caseBody.case) setData(caseBody.case);
      }
    } catch (err) {
      setSolveError(err.message);
      setCollecting(null);
    } finally {
      setSolving(false);
    }
  }

  const status              = data.computed_status || 'open';
  const isPendingModeration = !!data.pending_submission_id || pendingModeration;
  const detectives          = data.detectives || [];

  return (
    <>
      <style>{CSS}</style>

      <button className="cp-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="cp-top">
        <div className="cp-top-left">
          <div className="cp-eyebrow">Case number</div>
          <div className="cp-ref">#{data.id.slice(0, 8).toUpperCase()}</div>
          <div className="cp-descriptor">Investigating: &ldquo;{data.descriptor}&rdquo;</div>
          <div className="cp-status-row">
            <span className={`cp-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>
            <span className="cp-date">
              Opened {new Date(data.created_at).toLocaleDateString()}
              {data.created_by_rank && (
                <> · {data.created_by_rank}{data.created_by_last_name ? ` ${data.created_by_last_name}` : ''}</>
              )}
            </span>
          </div>
        </div>

        <div className="cp-team">
          <div className="cp-team-label">Investigation team</div>
          {detectives.length === 0
            ? <div className="cp-team-empty">No detectives yet</div>
            : detectives.map(d => {
              const rank    = getCurrentRank(d.total_points ?? 0);
              const display = d.last_name || d.username;
              const preset  = d.avatar_url && PRESET_MAP[d.avatar_url];
              return (
                <div key={d.user_id} className="cp-detective">
                  <div className="cp-detective-info">
                    <span className="cp-detective-rank">{rank.icon} {rank.name}</span>
                    <span className="cp-detective-name">{display}</span>
                  </div>
                  <div
                    className="cp-detective-avatar"
                    style={preset ? { background: preset.bg, fontSize: '.9rem' } : {}}
                  >
                    {preset
                      ? preset.emoji
                      : d.avatar_url && !d.avatar_url.startsWith('preset:')
                        ? <img src={d.avatar_url} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
                        : display[0].toUpperCase()
                    }
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {solveSuccess && (
        <div className="cp-success-banner">
          ✓ Match submitted — your identification is pending review by our moderation team.
          Once approved it will appear in search results and the case will be marked as solved.
        </div>
      )}

      <div className="cp-card">
        <div className="cp-card-title">The mystery</div>
        <div className="cp-card-body">
          {status === 'solved' ? (
            (() => {
              const usedSteps = STEPS.filter(s => evidence[s.key]);
              const how = usedSteps.length > 0
                ? usedSteps.map(s => s.label).join(' and ')
                : 'community investigation';
              return (
                <>
                  Case closed.{data.solved_merchant_name ? <> The descriptor <strong>&ldquo;{data.descriptor}&rdquo;</strong> was identified as <strong>{data.solved_merchant_name}</strong>.</> : ' This descriptor has been matched to a merchant.'}{' '}
                  Cracked using {how}.
                </>
              );
            })()
          ) : (
            <>
              The billing descriptor &ldquo;{data.descriptor}&rdquo; hasn&rsquo;t been identified yet.
              Work through each investigation step below and accept the evidence to solve the case.
            </>
          )}
        </div>
      </div>

      <div>
        <div className="cp-steps-header">
          <span className="cp-steps-title">Investigation</span>
        </div>
        <div className="cp-steps">
          {STEPS.map((step, idx) => {
            const ev           = evidence[step.key];
            const hasData      = !!ev;
            const isSolved     = status === 'solved';
            const isReadOnly   = isSolved || isPendingModeration;
            const prevDone     = idx === 0 || !!evidence[STEPS[idx - 1].key];
            const isLocked     = !prevDone;
            const isOpen       = idx <= activeStepIdx || (isPendingModeration && step.key === 'local_knowledge');
            const isNext       = idx < STEPS.length - 1;
            const isCollecting = collecting === step.key;

            // Solved case: hide steps that produced no evidence
            if (isSolved && !hasData) return null;

            return (
              <div key={step.key} className={`cp-step${hasData ? ' has-data' : ''}${isLocked && !isReadOnly ? ' locked' : ''}`}>
                <div className="cp-step-header">
                  <div className="cp-step-num">{idx + 1}</div>
                  <span className="cp-step-icon">{step.icon}</span>
                  {step.agent ? (
                    <div className="cp-step-label-wrap">
                      <span className="cp-step-label">{step.label}</span>
                      <span className="cp-step-sublabel">{step.agent.name} · {step.agent.division}</span>
                    </div>
                  ) : (
                    <span className="cp-step-label">{step.label}</span>
                  )}
                  {!isReadOnly && isLocked && <span className="cp-step-lock">Locked</span>}
                  {hasData && <span className="cp-step-done">✓ Done</span>}
                </div>

                {isOpen && <div className="cp-step-body">
                  {hasData ? (
                    <>
                      <EvidenceResults ev={ev} />
                      {step.agent && (
                        <span className="cp-agent-filed">Filed by {step.agent.name}, {step.agent.division}</span>
                      )}
                      {!isReadOnly && (
                        <div className="cp-step-actions">
                          <button className="cp-solve-btn" onClick={() => openConfirm(step.key)}>
                            Accept &amp; solve case →
                          </button>
                          {isNext && activeStepIdx === idx && (
                            <button className="cp-next-btn" onClick={() => setActiveStepIdx(idx + 1)}>
                              Continue to {STEPS[idx + 1].label} ↓
                            </button>
                          )}
                          <button
                            className="cp-recollect-btn"
                            onClick={() => step.manual ? setEvidence(ev => ({ ...ev, [step.key]: null })) : collect(step.key)}
                            disabled={isCollecting}
                          >
                            ↺ Re-enter
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="cp-step-desc">{step.desc}</p>
                      {isAuthenticated ? (
                        step.manual ? (
                          <LocalKnowledgeForm
                            onSubmit={form => openConfirm(step.key, form)}
                            submitting={isCollecting}
                            label={step.label}
                          />
                        ) : isCollecting ? (
                          <div className="cp-loader">
                            <div className="cp-loader-radar">
                              <div className="cp-loader-ring" />
                              <div className="cp-loader-ring" />
                              <div className="cp-loader-ring" />
                              <div className="cp-loader-dot" />
                            </div>
                            <div>
                              <div className="cp-loader-label">{step.agent ? step.agent.loadingLabel : 'Searching the web…'}</div>
                              <div className="cp-loader-sub">{step.agent ? step.agent.loadingSub : 'Agent is investigating — this may take a moment'}</div>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="cp-collect-btn"
                            onClick={() => collect(step.key)}
                            disabled={isLocked}
                          >
                            {step.agent ? `Brief ${step.agent.name}` : `Run ${step.label}`}
                          </button>
                        )
                      ) : (
                        <span className="cp-sign-in-note">Sign in to run this investigation</span>
                      )}
                    </>
                  )}
                  {errors[step.key] && (
                    <span className="cp-step-error">{errors[step.key]}</span>
                  )}
                  {isPendingModeration && step.key === 'local_knowledge' && (
                    <div className="cp-pending-msg">
                      ⏳ Your identification is pending review by our moderation team. Once approved, the case will be marked as solved and will appear in search results.
                    </div>
                  )}
                </div>}
              </div>
            );
          })}
        </div>
      </div>

      {confirmModal && (
        <ConfirmModal
          modal={confirmModal}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirmModal(null); setSolveError(null); }}
          confirming={solving}
          error={solveError}
        />
      )}
    </>
  );
}
