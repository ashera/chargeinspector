import { useAuth } from '../hooks/useAuth.jsx';
import { RANKS, getCurrentRank } from '../constants/ranks.js';

const CSS = `
  .rp-page { max-width: 580px; margin: 0 auto; padding: 2rem 1.5rem; }
  .rp-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0; margin-bottom: 1.75rem; display: inline-block;
  }
  .rp-back:hover { color: var(--text); }
  .rp-title { font-family: var(--font-display); font-size: 1.4rem; color: var(--text); margin-bottom: .3rem; }
  .rp-sub { font-size: .65rem; color: var(--text-muted); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 2.5rem; }

  .rp-list { position: relative; }
  .rp-connector {
    position: absolute; left: 1.35rem; top: 1.5rem; bottom: 1.5rem; width: 1px;
    background: linear-gradient(to bottom, transparent, var(--border) 8%, var(--border) 92%, transparent);
    pointer-events: none;
  }

  .rp-item { display: flex; gap: 1.25rem; padding: .85rem 0; position: relative; }

  .rp-icon-wrap {
    width: 2.75rem; height: 2.75rem; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--border); background: var(--bg-page);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.15rem; z-index: 1; transition: border-color .2s, box-shadow .2s;
  }
  .rp-item.achieved .rp-icon-wrap { border-color: #1e3a2a; background: #0a120a; }
  .rp-item.current .rp-icon-wrap {
    border-color: var(--accent); background: #0d1a0f;
    box-shadow: 0 0 0 4px rgba(74,222,128,.08);
  }
  .rp-item.future .rp-icon-wrap { opacity: .35; }

  .rp-body { flex: 1; padding-top: .2rem; }

  .rp-name-row { display: flex; align-items: center; gap: .6rem; margin-bottom: .2rem; flex-wrap: wrap; }
  .rp-name { font-size: .9rem; }
  .rp-item.future .rp-name { color: var(--text-muted); opacity: .55; }
  .rp-item.achieved .rp-name { color: var(--text-muted); }

  .rp-badge {
    font-size: .52rem; letter-spacing: .12em; text-transform: uppercase;
    padding: .15rem .55rem; border-radius: 2px; white-space: nowrap;
  }
  .rp-badge.here { color: var(--accent); border: 1px solid var(--accent); background: #0d1a0f; }
  .rp-badge.max  { color: #ffd700; border: 1px solid #5a4000; background: #181200; }

  .rp-desc {
    font-size: .7rem; color: var(--text-muted); margin-bottom: .25rem; line-height: 1.5;
  }
  .rp-item.future .rp-desc { opacity: .4; }

  .rp-pts { font-size: .62rem; letter-spacing: .04em; }
  .rp-pts.starting  { color: var(--text-dim); }
  .rp-pts.achieved  { color: #4ade80; }
  .rp-pts.locked    { color: var(--text-dim); }
  .rp-pts.current   { color: var(--text-muted); }

  .rp-progress { margin-top: .65rem; }
  .rp-progress-bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: .4rem; }
  .rp-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; }
  .rp-progress-labels { display: flex; justify-content: space-between; font-size: .6rem; color: var(--text-muted); }
  .rp-progress-labels strong { color: var(--accent); }

  .rp-maxed { font-size: .7rem; color: #ffd700; margin-top: .5rem; letter-spacing: .04em; }

  .rp-pts-col {
    flex-shrink: 0; text-align: right; padding-top: .35rem;
    font-size: .65rem; letter-spacing: .06em; color: var(--text-dim); white-space: nowrap;
    min-width: 4rem;
  }
  .rp-item.achieved .rp-pts-col { color: #2a6a3a; }
  .rp-item.current .rp-pts-col { color: var(--accent); }
  .rp-item.future .rp-pts-col { opacity: .35; }
`;

export default function RanksPage({ navigate }) {
  const { user, isAuthenticated } = useAuth();
  const pts         = user?.total_points ?? 0;
  const currentRank = isAuthenticated ? getCurrentRank(pts) : null;
  const currentIdx  = currentRank ? RANKS.findIndex(r => r.threshold === currentRank.threshold) : -1;
  const nextRank    = currentIdx >= 0 && currentIdx < RANKS.length - 1 ? RANKS[currentIdx + 1] : null;
  const progressPct = currentRank && nextRank
    ? Math.min(100, Math.round(((pts - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100))
    : 100;

  return (
    <>
      <style>{CSS}</style>
      <div className="rp-page">
        <button className="rp-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="rp-title">Rank Ladder</div>
        <div className="rp-sub">From Civilian to Commissioner</div>

        <div className="rp-list">
          <div className="rp-connector" />
          {RANKS.map((rank, idx) => {
            const isCurrent  = isAuthenticated && idx === currentIdx;
            const isAchieved = isAuthenticated && idx < currentIdx;
            const isFuture   = !isAuthenticated || idx > currentIdx;
            const isMax      = idx === RANKS.length - 1;

            const itemClass = `rp-item ${isCurrent ? 'current' : isAchieved ? 'achieved' : 'future'}`;

            return (
              <div key={rank.name} className={itemClass}>
                <div className="rp-icon-wrap">{rank.icon}</div>

                <div className="rp-body">
                  <div className="rp-name-row">
                    <span className="rp-name">{rank.name}</span>
                    {isCurrent && <span className="rp-badge here">You are here</span>}
                    {isMax && (isCurrent || isAchieved) && <span className="rp-badge max">Max rank</span>}
                  </div>
                  <div className="rp-desc">{rank.description}</div>
                  {rank.threshold === 0
                    ? <span className="rp-pts starting">Starting rank</span>
                    : isAchieved
                      ? <span className="rp-pts achieved">✓ Achieved at {rank.threshold} pts</span>
                      : isCurrent
                        ? <span className="rp-pts current">Unlocked at {rank.threshold} pts</span>
                        : <span className="rp-pts locked">{rank.threshold} pts to unlock</span>
                  }
                  {isCurrent && nextRank && (
                    <div className="rp-progress">
                      <div className="rp-progress-bar">
                        <div className="rp-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="rp-progress-labels">
                        <span>{pts - currentRank.threshold} / {nextRank.threshold - currentRank.threshold} pts earned</span>
                        <span><strong>{nextRank.threshold - pts} pts</strong> to {nextRank.icon} {nextRank.name}</span>
                      </div>
                    </div>
                  )}
                  {isCurrent && !nextRank && (
                    <div className="rp-maxed">Maximum rank achieved — legendary status!</div>
                  )}
                </div>

                <div className="rp-pts-col">
                  {rank.threshold === 0 ? '0 pts' : `${rank.threshold} pts`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
