import { useState, useEffect } from 'react';

const CSS = `
  .cp-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer; background: none; border: none;
    font-family: 'DM Mono', monospace; padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .cp-back:hover { color: #f0ede6; }
  .cp-top {
    display: flex; gap: 2rem; align-items: flex-start; margin-bottom: 1.5rem;
  }
  .cp-top-left { flex: 1; min-width: 0; }
  .cp-eyebrow {
    font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: .3rem;
  }
  .cp-ref {
    font-family: 'DM Mono', monospace; font-size: .65rem;
    color: #2e2e2e; letter-spacing: .12em; margin-bottom: 1.25rem;
  }
  .cp-descriptor {
    font-family: 'DM Mono', monospace; font-size: 1.5rem;
    color: #f0b429; letter-spacing: .08em; margin-bottom: 1.25rem; line-height: 1.2;
  }
  .cp-status-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .cp-status {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    padding: .3rem .75rem; border-radius: 2px;
  }
  .cp-status.open          { color: #e0c05c; border: 1px solid #3a3010; background: #1a1608; }
  .cp-status.investigating { color: #6ee7a0; border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-status.solved        { color: #6ee7a0; border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-date { font-size: .65rem; color: #2e2e2e; }

  .cp-team {
    flex-shrink: 0; text-align: right;
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1rem 1.25rem; min-width: 160px;
  }
  .cp-team-label {
    font-size: .55rem; letter-spacing: .16em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: .85rem;
  }
  .cp-detective {
    display: flex; align-items: center; justify-content: flex-end;
    gap: .5rem; margin-bottom: .5rem;
  }
  .cp-detective:last-child { margin-bottom: 0; }
  .cp-detective-name { font-size: .7rem; color: #f0ede6; }
  .cp-detective-avatar {
    width: 22px; height: 22px; border-radius: 50%;
    background: #1e1e1e; border: 1px solid #2e2e2e;
    display: flex; align-items: center; justify-content: center;
    font-size: .65rem; color: #4b4b4b; flex-shrink: 0;
    text-transform: uppercase; font-family: 'DM Mono', monospace;
  }
  .cp-team-empty { font-size: .65rem; color: #2e2e2e; }

  .cp-card {
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1.5rem; margin-bottom: 1.5rem;
  }
  .cp-card-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: .75rem;
  }
  .cp-card-body { font-size: .8rem; color: #4b4b4b; line-height: 1.7; }
  .cp-btn {
    padding: .85rem 1.75rem; background: #6ee7a0; border: none; border-radius: 2px;
    font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .14em;
    text-transform: uppercase; color: #0a0a0a; font-weight: 500; cursor: pointer;
  }
  .cp-btn:hover { opacity: .9; }
  @media (max-width: 540px) {
    .cp-top { flex-direction: column-reverse; }
    .cp-team { text-align: left; min-width: 0; width: 100%; }
    .cp-detective { justify-content: flex-start; }
  }
`;

const STATUS_LABEL = { open: 'Open', investigating: 'Investigating', solved: 'Solved' };

export default function CasePage({ caseData: initialData, navigate }) {
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
          <div className="cp-descriptor">{data.descriptor}</div>
          <div className="cp-status-row">
            <span className={`cp-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>
            <span className="cp-date">Opened {new Date(data.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="cp-team">
          <div className="cp-team-label">Investigation team</div>
          {detectives.length === 0
            ? <div className="cp-team-empty">No detectives yet</div>
            : detectives.map(d => (
              <div key={d.user_id} className="cp-detective">
                <span className="cp-detective-name">{d.username}</span>
                <div className="cp-detective-avatar">{d.username[0]}</div>
              </div>
            ))
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

      <button className="cp-btn" onClick={() => navigate('submit', { descriptor: data.descriptor })}>
        Submit a match →
      </button>
    </>
  );
}
