import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CSS = `
  .dd-back {
    font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    color: #4b4b4b; cursor: pointer; background: none; border: none;
    font-family: 'DM Mono', monospace; padding: 0; margin-bottom: 2rem;
    display: inline-block;
  }
  .dd-back:hover { color: #f0ede6; }
  .dd-eyebrow {
    font-size: .65rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: .4rem;
  }
  .dd-title {
    font-family: 'DM Mono', monospace; font-size: 1.5rem;
    letter-spacing: .08em; color: #6ee7a0; margin-bottom: 2rem;
  }
  .dd-section-title {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: #4b4b4b; margin-bottom: 1rem; border-bottom: 1px solid #1e1e1e;
    padding-bottom: .5rem;
  }
  .dd-chart-wrap {
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1.25rem 1.25rem 0.5rem; margin-bottom: 2rem;
  }
  .dd-card {
    background: #111; border: 1px solid #1e1e1e; border-radius: 3px;
    padding: 1.25rem; margin-bottom: 1rem;
    display: flex; gap: 1.25rem; align-items: flex-start;
  }
  .dd-logo {
    width: 52px; height: 52px; border-radius: 3px;
    object-fit: contain; background: #1a1a1a; flex-shrink: 0;
  }
  .dd-logo-placeholder {
    width: 52px; height: 52px; border-radius: 3px;
    background: #1a1a1a; border: 1px solid #1e1e1e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
  }
  .dd-card-body { flex: 1; min-width: 0; }
  .dd-merchant-name { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: .25rem; }
  .dd-meta { font-size: .7rem; color: #4b4b4b; display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .4rem; }
  .dd-meta a { color: #6ee7a0; text-decoration: none; }
  .dd-meta a:hover { text-decoration: underline; }
  .dd-votes { font-size: .65rem; color: #4b4b4b; margin-top: .4rem; }
  .dd-card-action { margin-left: auto; flex-shrink: 0; align-self: center; }
  .dd-btn {
    padding: .55rem 1rem; border: 1px solid #1e1e1e; border-radius: 2px;
    background: none; color: #4b4b4b; font-family: 'DM Mono', monospace;
    font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s;
  }
  .dd-btn:hover { color: #f0ede6; border-color: #4b4b4b; }
  .dd-empty { font-size: .75rem; color: #4b4b4b; padding: 2rem 0; }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 2, padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: '.7rem', color: '#f0ede6' }}>
      <div style={{ color: '#4b4b4b', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#6ee7a0' }}>{payload[0].value} view{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

export default function DescriptorDetailsPage({ descriptor, descriptorId, navigate }) {
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
                <CartesianGrid vertical={false} stroke="#1e1e1e" />
                <XAxis
                  dataKey="date"
                  ticks={tickDates}
                  tick={{ fill: '#4b4b4b', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#4b4b4b', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a1a1a' }} />
                <Bar dataKey="views" fill="#6ee7a0" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {!loading && !hasViews && (
              <p style={{ textAlign: 'center', fontSize: '.7rem', color: '#2e2e2e', paddingBottom: '.75rem' }}>No views recorded yet</p>
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
