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

const CSS = `
  .cp-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .cp-back:hover { color: var(--text); }
  .cp-top {
    display: flex; gap: 2rem; align-items: flex-start; margin-bottom: 1.5rem;
  }
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
  .cp-status.investigating { color: var(--accent); border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-status.solved        { color: var(--accent); border: 1px solid #1e3a2a; background: #0d1a0f; }
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
  .cp-btn {
    padding: .85rem 1.75rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .7rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-btn:hover { opacity: .9; }
  .cp-btn:disabled { opacity: .5; cursor: default; }

  .cp-evidence-room { margin-bottom: 1.5rem; }
  .cp-evidence-header {
    display: flex; align-items: baseline; gap: .75rem; margin-bottom: 1rem;
    border-bottom: 1px solid var(--border); padding-bottom: .5rem;
  }
  .cp-evidence-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-muted);
  }
  .cp-evidence-count {
    font-size: .6rem; letter-spacing: .08em; color: var(--text-dim);
  }
  .cp-evidence-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem;
  }
  .cp-evidence-slot {
    border: 1px dashed var(--border); border-radius: 3px;
    padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: .4rem;
  }
  .cp-evidence-slot.has-data { border-style: solid; border-color: var(--border-subtle); }
  .cp-evidence-slot-icon { font-size: 1.2rem; line-height: 1; }
  .cp-evidence-slot-label {
    font-size: .65rem; letter-spacing: .08em; color: var(--text-muted);
  }
  .cp-evidence-slot-desc {
    font-size: .62rem; color: var(--text-dim); line-height: 1.5;
  }
  .cp-evidence-slot-empty {
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--border-subtle); margin-top: .25rem;
  }
  .cp-collect-btn {
    margin-top: .5rem; padding: .4rem .75rem; background: none;
    border: 1px solid var(--border); border-radius: 2px;
    font-family: var(--font-ui); font-size: .6rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
    align-self: flex-start;
  }
  .cp-collect-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .cp-collect-btn:disabled { opacity: .5; cursor: default; }
  .cp-collecting {
    font-size: .62rem; color: var(--accent); margin-top: .5rem; letter-spacing: .06em;
  }

  .cp-wi-merchant { font-size: .8rem; color: var(--text); font-weight: 500; margin-top: .35rem; }
  .cp-wi-confidence {
    display: inline-block; font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    padding: .15rem .5rem; border-radius: 2px; margin-top: .2rem;
  }
  .cp-wi-confidence.high   { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-wi-confidence.medium { color: var(--warning); border: 1px solid #3a3010; background: #1a1608; }
  .cp-wi-confidence.low    { color: var(--text-dim); border: 1px solid var(--border); background: transparent; }
  .cp-wi-btype { font-size: .62rem; color: var(--text-dim); margin-top: .2rem; }
  .cp-wi-desc { font-size: .68rem; color: var(--text-muted); line-height: 1.55; margin-top: .5rem; }
  .cp-wi-sources { margin-top: .6rem; display: flex; flex-direction: column; gap: .3rem; }
  .cp-wi-source {
    font-size: .6rem; color: var(--accent); text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cp-wi-source:hover { text-decoration: underline; }
  .cp-wi-recollect {
    margin-top: .6rem; font-size: .58rem; letter-spacing: .08em; text-transform: uppercase;
    background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 0;
    font-family: var(--font-ui);
  }
  .cp-wi-recollect:hover { color: var(--text-muted); }
  .cp-wi-error { font-size: .65rem; color: #e05; margin-top: .4rem; }

  @media (max-width: 600px) { .cp-evidence-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 400px) { .cp-evidence-grid { grid-template-columns: 1fr; } }

  @media (max-width: 540px) {
    .cp-top { flex-direction: column-reverse; }
    .cp-team { text-align: left; min-width: 0; width: 100%; }
    .cp-detective { justify-content: flex-start; }
    .cp-detective-info { align-items: flex-start; }
  }
`;

const STATUS_LABEL = { open: 'Open', investigating: 'Investigating', solved: 'Solved' };

const EVIDENCE_TYPES = [
  { key: 'web_intelligence',    icon: '🌐', label: 'Web Intelligence',      desc: 'Online mentions, search results and web traces'           },
  { key: 'merchant_matches',    icon: '🏪', label: 'Merchant Matches',      desc: 'Community-identified merchants linked to this descriptor' },
  { key: 'witness_tips',        icon: '💬', label: 'Witness Tips',          desc: 'Tips and insights submitted by investigators'            },
  { key: 'similar_descriptors', icon: '🔗', label: 'Similar Descriptors',   desc: 'Related billing descriptors found in the database'       },
  { key: 'transaction_data',    icon: '📊', label: 'Transaction Patterns',  desc: 'Reported amounts, frequencies and timing'                },
  { key: 'visual_evidence',     icon: '📸', label: 'Visual Evidence',       desc: 'Logos, screenshots and imagery collected'                },
];

function WebIntelligenceSlot({ caseId, apiFetch, isAuthenticated }) {
  const [wi, setWi]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/evidence`)
      .then(r => r.json())
      .then(d => {
        const item = (d.evidence || []).find(e => e.type === 'web_intelligence');
        setWi(item ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caseId]);

  async function collect() {
    setCollecting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/cases/${caseId}/evidence/collect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'web_intelligence' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Collection failed');
      setWi(data.evidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setCollecting(false);
    }
  }

  const slot = EVIDENCE_TYPES[0];

  return (
    <div className={`cp-evidence-slot${wi ? ' has-data' : ''}`}>
      <span className="cp-evidence-slot-icon">{slot.icon}</span>
      <span className="cp-evidence-slot-label">{slot.label}</span>

      {loading ? (
        <span className="cp-evidence-slot-desc">Loading…</span>
      ) : wi ? (
        <>
          {wi.merchant_name && (
            <span className="cp-wi-merchant">{wi.merchant_name}</span>
          )}
          {wi.confidence && (
            <span className={`cp-wi-confidence ${wi.confidence}`}>{wi.confidence} confidence</span>
          )}
          {wi.business_type && (
            <span className="cp-wi-btype">{wi.business_type}</span>
          )}
          {wi.description && (
            <span className="cp-wi-desc">{wi.description}</span>
          )}
          {Array.isArray(wi.sources) && wi.sources.length > 0 && (
            <div className="cp-wi-sources">
              {wi.sources.slice(0, 3).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="cp-wi-source">
                  {s.title || s.url}
                </a>
              ))}
            </div>
          )}
          {isAuthenticated && (
            <button className="cp-wi-recollect" onClick={collect} disabled={collecting}>
              {collecting ? 'Re-collecting…' : '↺ Re-collect'}
            </button>
          )}
        </>
      ) : (
        <>
          <span className="cp-evidence-slot-desc">{slot.desc}</span>
          {isAuthenticated ? (
            <>
              <button className="cp-collect-btn" onClick={collect} disabled={collecting}>
                {collecting ? 'Collecting…' : 'Collect intelligence'}
              </button>
              {collecting && (
                <span className="cp-collecting">Agent searching the web…</span>
              )}
            </>
          ) : (
            <span className="cp-evidence-slot-empty">Sign in to collect</span>
          )}
        </>
      )}
      {error && <span className="cp-wi-error">{error}</span>}
    </div>
  );
}

export default function CasePage({ caseData: initialData, navigate }) {
  const { apiFetch, isAuthenticated } = useAuth();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    fetch(`/api/cases/${initialData.id}`)
      .then(r => r.json())
      .then(d => { if (d.case) setData(d.case); })
      .catch(() => {});
  }, [initialData.id]);

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
          This billing descriptor hasn't been identified yet. The community is working to crack this case.
          If you recognise this merchant, submit a match to help others solve the mystery.
        </div>
      </div>

      <div className="cp-evidence-room">
        <div className="cp-evidence-header">
          <span className="cp-evidence-title">Evidence Room</span>
        </div>
        <div className="cp-evidence-grid">
          <WebIntelligenceSlot
            caseId={data.id}
            apiFetch={apiFetch}
            isAuthenticated={isAuthenticated}
          />
          {EVIDENCE_TYPES.slice(1).map(({ key, icon, label, desc }) => (
            <div key={key} className="cp-evidence-slot">
              <span className="cp-evidence-slot-icon">{icon}</span>
              <span className="cp-evidence-slot-label">{label}</span>
              <span className="cp-evidence-slot-desc">{desc}</span>
              <span className="cp-evidence-slot-empty">No evidence yet</span>
            </div>
          ))}
        </div>
      </div>

      <button className="cp-btn" onClick={() => navigate('submit', { descriptor: data.descriptor })}>
        Submit a match →
      </button>
    </>
  );
}
