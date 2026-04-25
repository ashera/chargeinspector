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
  { key: 'web_intelligence',  icon: '🌐', label: 'Web Intelligence',  desc: 'AI-powered web search to identify the merchant behind this descriptor' },
  { key: 'witness_tips',      icon: '💬', label: 'Witness Tips',      desc: 'Community reports, forums and consumer complaints about this charge'   },
  { key: 'transaction_mafia', icon: '💰', label: 'Transaction Mafia', desc: 'Payment forensics: processor registrations, MCC codes and patterns'    },
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

export default function CasePage({ caseData: initialData, navigate }) {
  const { apiFetch, isAuthenticated } = useAuth();
  const [data, setData]       = useState(initialData);
  const [evidence, setEvidence] = useState({});   // { type: most-recent-row }
  const [collecting, setCollecting] = useState(null);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    fetch(`/api/cases/${initialData.id}`)
      .then(r => r.json())
      .then(d => { if (d.case) setData(d.case); })
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
      })
      .catch(() => {});
  }, [initialData.id]);

  async function collect(type) {
    setCollecting(type);
    setErrors(e => ({ ...e, [type]: null }));
    try {
      const res  = await apiFetch(`/api/cases/${initialData.id}/evidence/collect`, {
        method: 'POST',
        body: JSON.stringify({ type }),
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

  function acceptAndSolve(type) {
    const ev = evidence[type];
    navigate('submit', {
      descriptor: data.descriptor,
      merchant:   ev?.merchant_name || '',
    });
  }

  const status     = data.computed_status || 'open';
  const detectives = data.detectives || [];

  return (
    <>
      <style>{CSS}</style>

      <button className="cp-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="cp-top">
        <div className="cp-top-left">
          <div className="cp-eyebrow">Open case</div>
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

      <div className="cp-card">
        <div className="cp-card-title">The mystery</div>
        <div className="cp-card-body">
          This billing descriptor hasn't been identified yet. Work through each investigation step below.
          At any point you can accept the evidence and submit a merchant match to solve the case.
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
            const prevDone     = idx === 0 || !!evidence[STEPS[idx - 1].key];
            const isLocked     = !prevDone;
            const isNext       = idx < STEPS.length - 1;
            const isCollecting = collecting === step.key;

            // Solved case: hide steps that produced no evidence
            if (isSolved && !hasData) return null;

            return (
              <div key={step.key} className={`cp-step${hasData ? ' has-data' : ''}${isLocked && !isSolved ? ' locked' : ''}`}>
                <div className="cp-step-header">
                  <div className="cp-step-num">{idx + 1}</div>
                  <span className="cp-step-icon">{step.icon}</span>
                  <span className="cp-step-label">{step.label}</span>
                  {!isSolved && isLocked && <span className="cp-step-lock">Locked</span>}
                  {hasData && <span className="cp-step-done">✓ Done</span>}
                </div>

                <div className="cp-step-body">
                  {hasData ? (
                    <>
                      <EvidenceResults ev={ev} />
                      {!isSolved && (
                        <div className="cp-step-actions">
                          <button className="cp-solve-btn" onClick={() => acceptAndSolve(step.key)}>
                            Accept &amp; solve case →
                          </button>
                          {isNext && !evidence[STEPS[idx + 1].key] && (
                            <button className="cp-next-btn" onClick={() => {}}>
                              Continue to {STEPS[idx + 1].label} ↓
                            </button>
                          )}
                          <button
                            className="cp-recollect-btn"
                            onClick={() => collect(step.key)}
                            disabled={isCollecting}
                          >
                            {isCollecting ? 'Re-collecting…' : '↺ Re-collect'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="cp-step-desc">{step.desc}</p>
                      {isAuthenticated ? (
                        <button
                          className="cp-collect-btn"
                          onClick={() => collect(step.key)}
                          disabled={isCollecting || isLocked}
                        >
                          {isCollecting ? 'Collecting…' : `Run ${step.label}`}
                        </button>
                      ) : (
                        <span className="cp-sign-in-note">Sign in to run this investigation</span>
                      )}
                      {isCollecting && (
                        <span className="cp-collecting">Agent searching the web — this may take a moment…</span>
                      )}
                    </>
                  )}
                  {errors[step.key] && (
                    <span className="cp-step-error">{errors[step.key]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status !== 'solved' && (
        <button className="cp-submit-btn" onClick={() => navigate('submit', { descriptor: data.descriptor })}>
          Submit a match manually →
        </button>
      )}
    </>
  );
}
