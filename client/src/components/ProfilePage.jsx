import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  .prof-header { display: flex; align-items: flex-start; gap: 1.5rem; margin-bottom: 2.5rem; }
  .prof-avatar {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--bg-hover); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0; overflow: hidden;
  }
  .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .prof-avatar-initials {
    font-family: var(--font-display); font-size: 1.4rem; color: var(--accent); line-height: 1;
  }
  .prof-header-info { flex: 1; min-width: 0; }
  .prof-name { font-family: var(--font-display); font-size: 1.4rem; margin-bottom: .2rem; line-height: 1.2; }
  .prof-email { font-size: .75rem; color: var(--text-muted); }
  .prof-pts { font-size: 1.5rem; color: var(--accent); font-family: var(--font-display); margin-top: .35rem; display: block; }
  .prof-edit-btn {
    flex-shrink: 0; margin-top: .1rem;
    padding: .45rem .9rem; border: 1px solid var(--border); border-radius: 2px;
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; transition: color .2s, border-color .2s; white-space: nowrap;
  }
  .prof-edit-btn:hover { color: var(--text); border-color: var(--text-muted); }

  .prof-edit-panel {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.5rem; margin-bottom: 2.5rem;
  }
  .prof-edit-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1.25rem;
  }
  .prof-edit-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .prof-edit-field { flex: 1; margin-bottom: 1rem; }
  .prof-edit-field:last-child { margin-bottom: 0; }
  .prof-edit-label {
    display: block; font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .4rem;
  }
  .prof-edit-input {
    width: 100%; padding: .65rem .85rem;
    background: var(--bg-page); border: 1px solid var(--border); border-radius: 2px;
    color: var(--text); font-family: var(--font-ui); font-size: .8rem;
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .prof-edit-input:focus { border-color: var(--accent); }
  .prof-edit-input::placeholder { color: var(--text-dim); }
  .prof-edit-actions { display: flex; gap: .75rem; margin-top: 1.25rem; }
  .prof-edit-save {
    padding: .65rem 1.5rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .prof-edit-save:disabled { opacity: .4; cursor: not-allowed; }
  .prof-edit-cancel {
    padding: .65rem 1.5rem; background: none; border: 1px solid var(--border); border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
    transition: color .2s, border-color .2s;
  }
  .prof-edit-cancel:hover { color: var(--text); border-color: var(--text-muted); }
  .prof-edit-msg-ok  { font-size: .72rem; color: var(--accent); margin-top: .75rem; }
  .prof-edit-msg-err { font-size: .72rem; color: var(--error);  margin-top: .75rem; }

  .prof-avatar-picker { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .25rem; }
  .prof-avatar-option {
    width: 48px; height: 48px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer;
    font-size: 1.4rem; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: border-color .15s, transform .1s;
  }
  .prof-avatar-option:hover { transform: scale(1.1); }
  .prof-avatar-option.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .prof-avatar-none {
    width: 48px; height: 48px; border-radius: 50%;
    border: 1px dashed var(--border); background: none; cursor: pointer;
    font-size: .5rem; letter-spacing: .06em; text-transform: uppercase;
    color: var(--text-dim); transition: color .2s, border-color .2s; flex-shrink: 0;
  }
  .prof-avatar-none:hover { color: var(--text-muted); border-color: var(--text-muted); }

  .prof-section { margin-bottom: 2.5rem; }
  .prof-section-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1rem; border-bottom: 1px solid var(--border);
    padding-bottom: .5rem;
  }
  .prof-rank-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1.25rem;
    margin-bottom: .85rem;
  }
  .prof-rank-icon { font-size: 2.2rem; flex-shrink: 0; line-height: 1; }
  .prof-rank-name { font-family: var(--font-display); font-size: 1.3rem; line-height: 1.1; margin-bottom: .2rem; }
  .prof-rank-desc { font-size: .7rem; color: var(--text-muted); }
  .prof-rank-bar-wrap { height: 4px; background: var(--bg-hover); border-radius: 2px; overflow: hidden; margin-bottom: .45rem; }
  .prof-rank-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width .4s; }
  .prof-rank-bar-labels { display: flex; justify-content: space-between; font-size: .62rem; color: var(--text-muted); }
  .prof-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
  .prof-table th {
    text-align: left; font-size: .6rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-muted); padding: .5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .prof-table td { padding: .6rem 0; border-bottom: 1px solid var(--bg-card); color: var(--text); }
  .prof-status-approved { color: var(--accent); }
  .prof-status-pending  { color: var(--warning); }
  .prof-status-rejected { color: var(--error); }
  .prof-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .prof-table { min-width: 480px; }
  .prof-case-open         { color: var(--warning); }
  .prof-case-investigating { color: var(--accent); }
  .prof-case-solved       { color: var(--accent); }
  .prof-case-row { cursor: pointer; }
  .prof-case-row:hover td { background: var(--bg-hover); }
  @media (max-width: 500px) {
    .prof-header { gap: 1rem; }
    .prof-edit-row { flex-direction: column; gap: 0; }
  }
`;

const PRESETS = [
  { key: 'preset:detective',  emoji: '🕵️', bg: '#0f1f3a', label: 'Detective'    },
  { key: 'preset:magnifier',  emoji: '🔍', bg: '#1a3a2a', label: 'Investigator' },
  { key: 'preset:fedora',     emoji: '🎩', bg: '#1a1a2a', label: 'The Hat'      },
  { key: 'preset:dagger',     emoji: '🗡️', bg: '#3a1010', label: 'Blade'        },
  { key: 'preset:file',       emoji: '📋', bg: '#0a2a3a', label: 'Case File'    },
  { key: 'preset:candle',     emoji: '🕯️', bg: '#2a1a08', label: 'Candlelit'   },
  { key: 'preset:lock',       emoji: '🔐', bg: '#1a2a1a', label: 'Locked'       },
  { key: 'preset:map',        emoji: '🗺️', bg: '#2a2010', label: 'Cartographer' },
  { key: 'preset:phone',      emoji: '📞', bg: '#0a2a2a', label: 'Informant'    },
  { key: 'preset:briefcase',  emoji: '💼', bg: '#2a152a', label: 'Agent'        },
  { key: 'preset:flashlight', emoji: '🔦', bg: '#0a0f2a', label: 'Nightwatch'   },
  { key: 'preset:skull',      emoji: '💀', bg: '#2a0a0a', label: 'Unknown'      },
];
const PRESET_MAP = Object.fromEntries(PRESETS.map(p => [p.key, p]));

function Avatar({ user }) {
  const [imgErr, setImgErr] = useState(false);
  const preset = user.avatar_url && PRESET_MAP[user.avatar_url];
  if (preset) {
    return (
      <div className="prof-avatar" style={{ background: preset.bg, border: 'none' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{preset.emoji}</span>
      </div>
    );
  }
  if (user.avatar_url && !imgErr) {
    return (
      <div className="prof-avatar">
        <img src={user.avatar_url} alt="" onError={() => setImgErr(true)} />
      </div>
    );
  }
  if (user.first_name) {
    const initials = user.first_name[0].toUpperCase() + (user.last_name?.[0]?.toUpperCase() ?? '');
    return <div className="prof-avatar"><span className="prof-avatar-initials">{initials}</span></div>;
  }
  return <div className="prof-avatar">👤</div>;
}

export default function ProfilePage({ navigate }) {
  const { apiFetch, updateUser } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ first_name: '', last_name: '', avatar_url: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null); // { text, ok }

  useEffect(() => {
    apiFetch('/api/users/me/stats')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setForm({
          first_name: d.user.first_name || '',
          last_name:  d.user.last_name  || '',
          avatar_url: d.user.avatar_url || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const openEdit  = () => { setEditing(true); setMsg(null); };
  const cancelEdit = () => {
    setEditing(false);
    setMsg(null);
    setForm({
      first_name: data.user.first_name || '',
      last_name:  data.user.last_name  || '',
      avatar_url: data.user.avatar_url || '',
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res  = await apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setMsg({ text: json.error || 'Failed to save.', ok: false }); return; }
      setData(d => ({ ...d, user: { ...d.user, ...json.user } }));
      updateUser({ first_name: json.user.first_name, last_name: json.user.last_name });
      setForm({
        first_name: json.user.first_name || '',
        last_name:  json.user.last_name  || '',
        avatar_url: json.user.avatar_url || '',
      });
      setEditing(false);
      setMsg({ text: 'Profile updated.', ok: true });
    } catch {
      setMsg({ text: 'Something went wrong.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <p style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>Loading…</p>;
  if (!data)   return <p style={{ color: 'var(--error)', fontSize: '.75rem' }}>Failed to load profile.</p>;

  const { user, currentRank, nextRank, submissions, cases } = data;
  const progressPct = currentRank && nextRank
    ? Math.round(((user.total_points - currentRank.points_threshold) /
        (nextRank.points_threshold - currentRank.points_threshold)) * 100)
    : 100;
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return (
    <>
      <style>{CSS}</style>

      <div className="prof-header">
        <Avatar key={user.avatar_url || ''} user={user} />
        <div className="prof-header-info">
          {displayName && <div className="prof-name">{displayName}</div>}
          <div className="prof-email">{user.email}</div>
          <span className="prof-pts">{user.total_points} pts</span>
        </div>
        <button className="prof-edit-btn" onClick={openEdit}>Edit profile</button>
      </div>

      {msg && !editing && (
        <p className={msg.ok ? 'prof-edit-msg-ok' : 'prof-edit-msg-err'} style={{ marginBottom: '1.5rem' }}>
          {msg.text}
        </p>
      )}

      {editing && (
        <div className="prof-edit-panel">
          <div className="prof-edit-title">Edit profile</div>
          <div className="prof-edit-row">
            <div className="prof-edit-field">
              <label className="prof-edit-label">First name</label>
              <input className="prof-edit-input" placeholder="Ada" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="prof-edit-field">
              <label className="prof-edit-label">Last name</label>
              <input className="prof-edit-input" placeholder="Lovelace" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="prof-edit-field">
            <label className="prof-edit-label">Profile picture</label>
            <div className="prof-avatar-picker">
              {PRESETS.map(({ key, emoji, bg, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`prof-avatar-option${form.avatar_url === key ? ' selected' : ''}`}
                  style={{ background: bg }}
                  title={label}
                  onClick={() => setForm(f => ({ ...f, avatar_url: key }))}
                >
                  {emoji}
                </button>
              ))}
              {form.avatar_url && (
                <button type="button" className="prof-avatar-none" onClick={() => setForm(f => ({ ...f, avatar_url: '' }))}>
                  None
                </button>
              )}
            </div>
          </div>
          <div className="prof-edit-actions">
            <button className="prof-edit-save" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="prof-edit-cancel" onClick={cancelEdit}>Cancel</button>
          </div>
          {msg && <p className={msg.ok ? 'prof-edit-msg-ok' : 'prof-edit-msg-err'}>{msg.text}</p>}
        </div>
      )}

      <div className="prof-section">
        <div className="prof-section-title">Rank</div>
        {currentRank && (
          <>
            <div className="prof-rank-card">
              <span className="prof-rank-icon">{currentRank.icon}</span>
              <div>
                <div className="prof-rank-name">{currentRank.name}</div>
                <div className="prof-rank-desc">{currentRank.description}</div>
              </div>
            </div>
            <div className="prof-rank-bar-wrap">
              <div className="prof-rank-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="prof-rank-bar-labels">
              <span>{user.total_points} pts</span>
              {nextRank
                ? <span>{nextRank.points_threshold - user.total_points} pts to {nextRank.name}</span>
                : <span>Maximum rank achieved</span>
              }
            </div>
          </>
        )}
      </div>

      <div className="prof-section">
        <div className="prof-section-title">Your submissions</div>
        {submissions.length === 0
          ? <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>No submissions yet.</p>
          : (
            <div className="prof-table-wrap"><table className="prof-table">
              <thead>
                <tr>
                  <th>Descriptor</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.7rem', color: 'var(--accent)' }}>{s.descriptor}</td>
                    <td>{s.merchant_name}</td>
                    <td className={`prof-status-${s.status}`}>{s.status}</td>
                    <td>{s.upvote_count}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        }
      </div>

      <div className="prof-section">
        <div className="prof-section-title">Your cases</div>
        {cases.length === 0
          ? <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>No cases yet.</p>
          : (
            <div className="prof-table-wrap"><table className="prof-table">
              <thead>
                <tr>
                  <th>Descriptor</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="prof-case-row" onClick={() => navigate('case', { caseData: c })}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.7rem', color: 'var(--amber)' }}>{c.descriptor}</td>
                    <td className={`prof-case-${c.computed_status}`}>{c.computed_status}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '.7rem' }}>{c.connection}</td>
                    <td style={{ color: 'var(--text-dim)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        }
      </div>
    </>
  );
}
