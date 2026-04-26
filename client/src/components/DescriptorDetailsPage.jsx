import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useMeta } from '../hooks/useMeta.js';

const CSS = `
  .dd-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-muted); cursor: pointer; background: none; border: none;
    font-family: var(--font-ui); padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .dd-back:hover { color: var(--text); }
  .dd-eyebrow {
    font-size: .65rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .4rem;
  }
  .dd-title {
    font-family: var(--font-ui); font-size: 1.5rem;
    letter-spacing: .08em; color: var(--accent); margin-bottom: 2rem;
  }
  .dd-section-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 1rem; border-bottom: 1px solid var(--border);
    padding-bottom: .5rem;
  }
  .dd-chart-wrap {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem 1.25rem 0.5rem; margin-bottom: 2rem;
  }
  .dd-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px;
    padding: 1.25rem; margin-bottom: 1rem;
    display: flex; gap: 1.25rem; align-items: flex-start;
  }
  .dd-logo {
    width: 52px; height: 52px; border-radius: 3px;
    object-fit: contain; background: var(--bg-hover); flex-shrink: 0;
  }
  .dd-logo-placeholder {
    width: 52px; height: 52px; border-radius: 3px;
    background: var(--bg-hover); border: 1px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
  }
  .dd-card-body { flex: 1; min-width: 0; }
  .dd-merchant-name { font-family: var(--font-display); font-size: 1.2rem; margin-bottom: .25rem; }
  .dd-meta { font-size: .7rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .4rem; }
  .dd-meta a { color: var(--accent); text-decoration: none; }
  .dd-meta a:hover { text-decoration: underline; }
  .dd-votes { font-size: .65rem; color: var(--text-muted); margin-top: .4rem; }
  .dd-card-action { margin-left: auto; flex-shrink: 0; align-self: center; }
  .dd-btn {
    padding: .55rem 1rem; border: 1px solid var(--border); border-radius: 2px;
    background: none; color: var(--text-muted); font-family: var(--font-ui);
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s;
  }
  .dd-btn:hover { color: var(--text); border-color: var(--text-muted); }
  .dd-empty { font-size: .75rem; color: var(--text-muted); padding: 2rem 0; }
  @media (max-width: 500px) {
    .dd-card { flex-wrap: wrap; }
    .dd-card-action { width: 100%; margin-left: 0; }
    .dd-btn { width: 100%; text-align: center; }
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: '.7rem', color: 'var(--text)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--accent)' }}>{payload[0].value} view{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

export default function DescriptorDetailsPage({ descriptor, descriptorId, navigate }) {
  useMeta({
    title: descriptor,
    description: `Find out who is behind the "${descriptor}" charge on your bank statement. Community-verified merchant matches and billing descriptor details.`,
  });
  const [submissions, setSubmissions] = useState([]);
  const [viewData, setViewData]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchSubmissions = fetch(`/api/search/descriptor?q=${encodeURIComponent(descriptor)}`)
      .then(r => r.json())
      .then(d => setSubmissions(d.submissions || []));

    const fetchViews = descriptorId
      ? fetch(`/api/analytics/descriptor/${descriptorId}/views`)
          .then(r => r.json())
          .then(d => setViewData(d.views || []))
      : Promise.resolve();

    Promise.all([fetchSubmissions, fetchViews])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [descriptor, descriptorId]);

  const totalViews = viewData.reduce((sum, d) => sum + d.views, 0);
  const hasViews   = viewData.some(d => d.views > 0);

  // Show only the last 30 days but label every 7th tick to avoid crowding
  const tickDates = viewData
    .map(d => d.date)
    .filter((_, i) => i % 7 === 0 || i === viewData.length - 1);

  return (
    <>
      <style>{CSS}</style>

      <button className="dd-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="dd-eyebrow">Billing descriptor</div>
      <div className="dd-title">{descriptor}</div>

      {descriptorId && (
        <>
          <div className="dd-section-title">
            Views over the last 30 days {!loading && `· ${totalViews} total`}
          </div>
          <div className="dd-chart-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={viewData} barSize={8}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  ticks={tickDates}
                  tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="views" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {!loading && !hasViews && (
              <p style={{ textAlign: 'center', fontSize: '.7rem', color: 'var(--text-dim)', paddingBottom: '.75rem' }}>No views recorded yet</p>
            )}
          </div>
        </>
      )}

      <div className="dd-section-title">
        {loading ? 'Loading…' : `${submissions.length} approved merchant match${submissions.length !== 1 ? 'es' : ''}`}
      </div>

      {!loading && submissions.length === 0 && (
        <p className="dd-empty">No approved merchant matches found for this descriptor.</p>
      )}

      {submissions.map(s => (
        <div key={s.submission_id} className="dd-card">
          {s.logo_url
            ? <img className="dd-logo" src={s.logo_url} alt={s.name} />
            : <div className="dd-logo-placeholder">🏪</div>
          }
          <div className="dd-card-body">
            <div className="dd-merchant-name">{s.name}</div>
            <div className="dd-meta">
              {s.location && <span>📍 {s.location}</span>}
              {s.website  && <a href={s.website} target="_blank" rel="noreferrer">🌐 {s.website}</a>}
            </div>
            <div className="dd-votes">{s.upvote_count} confirmation{s.upvote_count !== 1 ? 's' : ''}</div>
          </div>
          <div className="dd-card-action">
            <button
              className="dd-btn"
              onClick={() => navigate('merchant', {
                merchant: {
                  merchant_id:   s.merchant_id,
                  submission_id: s.submission_id,
                  descriptor_id: s.descriptor_id,
                  descriptor:    s.descriptor,
                  name:          s.name,
                  location:      s.location,
                  website:       s.website,
                  logo_url:      s.logo_url,
                  upvote_count:  s.upvote_count,
                }
              })}
            >
              View merchant
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
