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

  .prof-section { margin-bottom: 2.5rem; }
  .prof-section-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1rem; border-bottom: 1px solid var(--border);
    padding-bottom: .5rem;
  }
  .prof-badges { display: flex; flex-wrap: wrap; gap: .75rem; }
  .prof-badge {
    padding: .5rem 1rem; border: 1px solid var(--border); border-radius: 2px;
    font-size: .7rem; color: var(--text); background: var(--bg-card);
  }
  .prof-badge-icon { margin-right: .4rem; }
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
  @media (max-width: 500px) {
    .prof-header { gap: 1rem; }
    .prof-edit-row { flex-direction: column; gap: 0; }
  }
`;

function Avatar({ user }) {
  const [imgErr, setImgErr] = useState(false);
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

export default function ProfilePage() {
  const { apiFetch }          = useAuth();
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

  const { user, badges, submissions } = data;
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
            <label className="prof-edit-label">Profile picture URL</label>
            <input
              className="prof-edit-input"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatar_url}
              onChange={set('avatar_url')}
            />
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
        <div className="prof-section-title">Badges</div>
        {badges.length === 0
          ? <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>No badges yet — start submitting to earn points!</p>
          : (
            <div className="prof-badges">
              {badges.map(b => (
                <div key={b.name} className="prof-badge" title={b.description}>
                  <span className="prof-badge-icon">{b.icon}</span>{b.name}
                </div>
              ))}
            </div>
          )
        }
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
    </>
  );
}
