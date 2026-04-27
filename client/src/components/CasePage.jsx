import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { RANKS, getCurrentRank } from '../constants/ranks.js';

const LESTRADE_SVG = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="40" fill="#0f1f0f"/>
  <!-- coat/shoulders -->
  <ellipse cx="40" cy="76" rx="26" ry="18" fill="#1a2e1a"/>
  <ellipse cx="40" cy="68" rx="16" ry="12" fill="#162614"/>
  <!-- cravat -->
  <polygon points="40,50 36,60 40,57 44,60" fill="#e8e0d0"/>
  <!-- neck -->
  <rect x="36" y="48" width="8" height="7" fill="#c8a882"/>
  <!-- head -->
  <ellipse cx="40" cy="40" rx="15" ry="16" fill="#c8a882"/>
  <!-- hat brim -->
  <ellipse cx="40" cy="26" rx="19" ry="4" fill="#111"/>
  <!-- hat crown -->
  <rect x="24" y="10" width="32" height="17" rx="3" fill="#1a1a1a"/>
  <!-- hat highlight -->
  <rect x="26" y="11" width="4" height="15" rx="2" fill="#2a2a2a" opacity="0.5"/>
  <!-- hat band -->
  <rect x="24" y="24" width="32" height="3" fill="#0d0d0d"/>
  <!-- eyes -->
  <ellipse cx="34" cy="40" rx="2.5" ry="2" fill="#fff"/>
  <circle cx="34" cy="40" r="1.2" fill="#2a1a08"/>
  <ellipse cx="46" cy="40" rx="2.5" ry="2" fill="#fff"/>
  <circle cx="46" cy="40" r="1.2" fill="#2a1a08"/>
  <!-- eyebrows -->
  <path d="M31,36 Q34,34 37,36" stroke="#5a3a1a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M43,36 Q46,34 49,36" stroke="#5a3a1a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- nose -->
  <ellipse cx="40" cy="44" rx="2" ry="1.5" fill="#b8906a"/>
  <!-- mustache -->
  <path d="M33,48 Q37,45 40,47 Q43,45 47,48" stroke="#3a2010" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M35,48 Q38,50 40,49 Q42,50 45,48" stroke="#3a2010" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;

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
    desc: 'Enter what you know about this merchant directly.',
    intro: 'Our detectives have not yet been able to identify the merchant with confidence. You can either submit your best guess here for review by our moderators, or leave this case for another community member to solve.' },
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
  .cp-solved-by {
    display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
    margin-top: .85rem; padding-top: .85rem; border-top: 1px solid var(--border);
    font-size: .68rem; color: var(--text-muted);
  }
  .cp-solved-by-label { color: var(--text-dim); }
  .cp-solved-by-name  { color: var(--text); }

  /* Location hint */
  .cp-hint-label {
    font-size: .6rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .4rem;
  }
  .cp-hint-sub {
    font-size: .75rem; color: var(--text-muted); line-height: 1.6; margin-bottom: .85rem;
  }
  .cp-hint-textarea {
    width: 100%; box-sizing: border-box; resize: vertical; min-height: 72px;
    background: var(--bg-page); border: 1px solid var(--border); border-radius: 2px;
    color: var(--text); font-family: var(--font-ui); font-size: .78rem;
    padding: .6rem .75rem; outline: none; transition: border-color .2s;
    display: block;
  }
  .cp-hint-textarea:focus { border-color: var(--accent); }
  .cp-hint-textarea::placeholder { color: var(--text-dim); }
  .cp-hint-textarea:disabled { opacity: .45; cursor: not-allowed; }
  .cp-hint-footer { display: flex; align-items: center; gap: .85rem; margin-top: .65rem; }
  .cp-hint-save {
    padding: .45rem 1rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .62rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--bg-page); cursor: pointer; font-weight: 500;
  }
  .cp-hint-save:hover { opacity: .9; }
  .cp-hint-save:disabled { opacity: .45; cursor: default; }
  .cp-hint-saved { font-size: .65rem; color: var(--accent); letter-spacing: .04em; }
  .cp-hint-note { font-size: .62rem; color: var(--text-dim); font-style: italic; }

  /* Investigation Steps */
  .cp-steps-header {
    display: flex; align-items: baseline; gap: .75rem; margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border); padding-bottom: .5rem;
  }
  .cp-steps-title {
    font-size: .6rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-muted);
  }
  .cp-reset-btn {
    margin-left: auto; background: none; border: none; cursor: pointer;
    font-family: var(--font-ui); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-dim); padding: 0;
  }
  .cp-reset-btn:hover { color: var(--error); }
  .cp-reset-confirm {
    margin-left: auto; display: flex; align-items: center; gap: .6rem;
  }
  .cp-reset-confirm-text { font-size: .62rem; color: var(--text-muted); }
  .cp-reset-confirm-yes {
    padding: .25rem .65rem; background: none; border: 1px solid var(--error);
    border-radius: 2px; font-family: var(--font-ui); font-size: .58rem; letter-spacing: .08em;
    text-transform: uppercase; color: var(--error); cursor: pointer;
  }
  .cp-reset-confirm-yes:disabled { opacity: .45; cursor: default; }
  .cp-reset-confirm-no {
    padding: .25rem .65rem; background: none; border: 1px solid var(--border);
    border-radius: 2px; font-family: var(--font-ui); font-size: .58rem; letter-spacing: .08em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
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
    display: flex; align-items: center; gap: .6rem; margin-top: .65rem;
    border-top: 1px solid var(--bg-card); padding-top: .65rem; width: 100%;
  }
  .cp-agent-avatar {
    width: 32px; height: 32px; border-radius: 50%; cursor: pointer; flex-shrink: 0;
    border: 1px solid var(--border); transition: border-color .2s;
  }
  .cp-agent-avatar:hover { border-color: var(--accent); }
  .cp-agent-filed-text {
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim);
  }
  .cp-agent-filed-text button {
    background: none; border: none; font-family: var(--font-ui);
    font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--text-dim); cursor: pointer; padding: 0; text-decoration: underline;
    text-decoration-style: dotted;
  }
  .cp-agent-filed-text button:hover { color: var(--accent); }

  /* Lestrade info modal */
  .cp-lestrade-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 400;
    display: flex; align-items: center; justify-content: center; padding: 1.5rem;
  }
  .cp-lestrade-modal {
    background: var(--bg-page); border: 1px solid var(--border); border-radius: 4px;
    max-width: 420px; width: 100%; padding: 1.75rem;
  }
  .cp-lestrade-header { display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.25rem; }
  .cp-lestrade-avatar-lg { width: 72px; height: 72px; border-radius: 50%; border: 1px solid var(--border); flex-shrink: 0; }
  .cp-lestrade-name { font-family: var(--font-display); font-size: 1.3rem; color: var(--text); margin-bottom: .2rem; }
  .cp-lestrade-division { font-size: .6rem; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
  .cp-lestrade-body { font-size: .75rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem; }
  .cp-lestrade-list { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: .4rem; }
  .cp-lestrade-list li { font-size: .72rem; color: var(--text-muted); display: flex; gap: .5rem; }
  .cp-lestrade-list li::before { content: "—"; color: var(--accent); flex-shrink: 0; }
  .cp-lestrade-close {
    width: 100%; padding: .6rem; border-radius: 2px;
    background: none; border: 1px solid var(--border); color: var(--text-muted);
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer;
  }
  .cp-lestrade-close:hover { border-color: var(--text-muted); color: var(--text); }

  /* CTA step — the next action the user should take */
  .cp-step.is-cta { border-color: var(--accent); }
  .cp-step.is-cta .cp-step-header {
    background: rgba(74,222,128,.04); border-bottom-color: rgba(74,222,128,.18);
  }
  .cp-step.is-cta .cp-step-num {
    background: #1e3a2a; border-color: var(--accent); color: var(--accent);
  }
  .cp-step.is-cta .cp-step-label { color: var(--text); }
  .cp-step.is-cta .cp-step-sublabel { color: var(--text-muted); }
  .cp-step.is-cta .cp-step-desc { color: var(--text-muted); }
  .cp-start-badge {
    font-size: .5rem; letter-spacing: .12em; text-transform: uppercase;
    color: var(--accent); padding: .15rem .5rem;
    border: 1px solid rgba(74,222,128,.35); border-radius: 2px;
    background: rgba(74,222,128,.07); white-space: nowrap;
  }
  .cp-collect-btn.cta {
    border-color: var(--accent); color: var(--accent);
    background: rgba(74,222,128,.06); padding: .65rem 1.5rem; font-size: .65rem;
  }
  .cp-collect-btn.cta:hover:not(:disabled) { background: var(--accent); color: var(--bg-page); }

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
  .cp-result-logo-wrap {
    display: flex; align-items: center; justify-content: center;
    width: 72px; height: 72px; border-radius: 6px;
    background: var(--bg-page); border: 1px solid var(--border);
    margin-bottom: .85rem; overflow: hidden; flex-shrink: 0;
  }
  .cp-result-logo { width: 72px; height: 72px; object-fit: contain; display: block; }
  .cp-result-header { display: flex; align-items: flex-start; gap: .85rem; margin-bottom: .15rem; }
  .cp-result-merchant { font-size: .9rem; color: var(--text); font-weight: 500; margin-bottom: .3rem; }
  .cp-result-unknown  { font-size: .8rem; color: var(--text-dim); font-style: italic; margin-bottom: .3rem; }
  .cp-confidence {
    display: inline-block; font-size: .55rem; letter-spacing: .1em; text-transform: uppercase;
    padding: .15rem .5rem; border-radius: 2px; margin-bottom: .35rem;
  }
  .cp-confidence.high   { color: var(--accent);  border: 1px solid #1e3a2a; background: #0d1a0f; }
  .cp-confidence.medium { color: var(--warning); border: 1px solid #3a3010; background: #1a1608; }
  .cp-confidence.low    { color: var(--text-dim); border: 1px solid var(--border); }
  .cp-result-btype     { font-size: .65rem; color: var(--text-dim); margin-bottom: .35rem; }
  .cp-result-location  { font-size: .65rem; color: var(--text-muted); margin-bottom: .55rem; }
  .cp-result-desc      { font-size: .72rem; color: var(--text-muted); line-height: 1.6; margin-bottom: .65rem; }
  .cp-result-sources { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .85rem; }
  .cp-result-source {
    font-size: .62rem; color: var(--accent); text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cp-result-source:hover { text-decoration: underline; }

  .cp-step-actions { display: flex; flex-direction: column; align-items: flex-start; gap: .75rem; margin-top: .85rem; padding-top: .85rem; border-top: 1px solid var(--border); }
  .cp-step-actions-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .cp-solve-hint  { font-size: .72rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  .cp-step-intro  { font-size: .75rem; color: var(--text-muted); line-height: 1.7; margin: 0 0 1rem; }
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

  /* Congratulations modal */
  .cp-congrats-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.8);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 1rem;
  }
  .cp-congrats-modal {
    background: var(--bg-card); border: 1px solid var(--accent);
    border-radius: 6px; width: 100%; max-width: 360px;
    padding: 2.5rem 1.75rem 1.75rem;
    text-align: center; position: relative; overflow: visible;
  }
  /* Fireworks */
  .cp-sparks {
    position: absolute; top: 2rem; left: 50%;
    width: 0; height: 0; pointer-events: none;
  }
  @keyframes cp-spark-fly {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
  }
  .cp-spark {
    position: absolute; border-radius: 50%;
    background: var(--color);
    transform: translate(0,0);
    animation: cp-spark-fly .85s ease-out var(--delay) both;
  }
  /* Modal content */
  .cp-congrats-eyebrow {
    font-size: .55rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: .5rem;
  }
  .cp-congrats-title {
    font-family: var(--font-display); font-size: 2rem; color: var(--text); margin-bottom: .25rem;
  }
  .cp-congrats-pts {
    font-family: var(--font-display); font-size: 2.75rem;
    color: var(--accent); margin-bottom: 1.5rem; letter-spacing: -.02em;
  }
  .cp-congrats-rank {
    display: flex; align-items: center; gap: 1rem; justify-content: center;
    background: var(--bg-page); border: 1px solid var(--border); border-radius: 3px;
    padding: .85rem 1.25rem; margin-bottom: 1.25rem; text-align: left;
  }
  .cp-congrats-rank-icon { font-size: 1.75rem; line-height: 1; }
  .cp-congrats-rank-name { font-size: .85rem; color: var(--text); margin-bottom: .15rem; }
  .cp-congrats-rank-total { font-size: .65rem; color: var(--text-muted); }
  .cp-congrats-progress { margin-bottom: 1.5rem; }
  .cp-congrats-progress-label {
    font-size: .65rem; color: var(--text-muted); margin-bottom: .45rem; text-align: left;
  }
  .cp-congrats-progress-track {
    height: 5px; background: var(--border); border-radius: 3px; overflow: hidden;
  }
  .cp-congrats-progress-fill {
    height: 100%; background: var(--accent); border-radius: 3px; transition: width .6s .2s ease;
  }
  .cp-congrats-maxrank {
    font-size: .75rem; color: var(--accent); margin-bottom: 1.5rem; letter-spacing: .06em;
  }
  .cp-congrats-actions { display: flex; gap: .75rem; }
  .cp-congrats-btn-primary {
    flex: 1; padding: .8rem; background: var(--accent); border: none; border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--bg-page); font-weight: 500; cursor: pointer;
  }
  .cp-congrats-btn-primary:hover { opacity: .9; }
  .cp-congrats-btn-secondary {
    flex: 1; padding: .8rem; background: none; border: 1px solid var(--border); border-radius: 2px;
    font-family: var(--font-ui); font-size: .65rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-muted); cursor: pointer;
  }
  .cp-congrats-btn-secondary:hover { border-color: var(--text-muted); color: var(--text); }

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
      {ev.logo_url && (
        <div className="cp-result-logo-wrap">
          <img
            className="cp-result-logo"
            src={ev.logo_url}
            alt=""
            onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="cp-result-header">
        <div>
          {ev.merchant_name
            ? <div className="cp-result-merchant">{ev.merchant_name}</div>
            : <div className="cp-result-unknown">Merchant not identified</div>
          }
          {ev.confidence && (
            <span className={`cp-confidence ${ev.confidence}`}>{ev.confidence} confidence</span>
          )}
        </div>
      </div>
      {ev.business_type && <div className="cp-result-btype">{ev.business_type}</div>}
      {ev.location      && <div className="cp-result-location">📍 {ev.location}</div>}
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

function LestradeModal({ onClose }) {
  const avatarSrc = `data:image/svg+xml;base64,${btoa(LESTRADE_SVG)}`;
  return (
    <div className="cp-lestrade-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-lestrade-modal">
        <div className="cp-lestrade-header">
          <img className="cp-lestrade-avatar-lg" src={avatarSrc} alt="Inspector Lestrade" />
          <div>
            <div className="cp-lestrade-name">Inspector Lestrade</div>
            <div className="cp-lestrade-division">Web Intelligence Division</div>
          </div>
        </div>
        <p className="cp-lestrade-body">
          Inspector Lestrade is an artificial intelligence agent powered by Claude. When a new descriptor case is opened, Lestrade is dispatched to carry out a methodical open-source investigation across the web.
        </p>
        <ul className="cp-lestrade-list">
          <li>Searches the open web and official company pages for the merchant behind the descriptor</li>
          <li>Investigates GitHub repositories, READMEs, and developer discussions for billing references</li>
          <li>Scours Reddit, consumer forums, and complaint boards for community reports of the charge</li>
          <li>Consults business registries, press mentions, and review sites for corroborating evidence</li>
          <li>Locates the merchant's official logo from their own website</li>
          <li>Files a confidence-rated report with sources for the community to review</li>
        </ul>
        <button className="cp-lestrade-close" onClick={onClose}>Close</button>
      </div>
    </div>
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

// Precomputed so spark positions are stable across renders
const SPARKS = Array.from({ length: 22 }, (_, i) => {
  const colors = ['#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];
  const angle  = (i / 22) * Math.PI * 2;
  const dist   = 48 + (i % 5) * 14;
  return {
    tx:    Math.round(Math.cos(angle) * dist),
    ty:    Math.round(Math.sin(angle) * dist),
    color: colors[i % colors.length],
    delay: `${(i * 0.035).toFixed(3)}s`,
    size:  5 + (i % 3) * 3,
  };
});

function CongratulationsModal({ modal, onClose, navigate }) {
  const { pointsAwarded, totalPoints } = modal;
  const rank     = getCurrentRank(totalPoints);
  const nextRank = RANKS.find(r => r.threshold > totalPoints) ?? null;
  const pct      = nextRank
    ? Math.round(((totalPoints - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100)
    : 100;
  const toNext = nextRank ? nextRank.threshold - totalPoints : 0;

  return (
    <div className="cp-congrats-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-congrats-modal">
        <div className="cp-sparks" aria-hidden="true">
          {SPARKS.map((s, i) => (
            <div key={i} className="cp-spark" style={{
              '--tx': `${s.tx}px`, '--ty': `${s.ty}px`,
              '--color': s.color, '--delay': s.delay,
              width: s.size, height: s.size,
            }} />
          ))}
        </div>

        <div className="cp-congrats-eyebrow">Case solved</div>
        <div className="cp-congrats-title">Congratulations!</div>
        <div className="cp-congrats-pts">+{pointsAwarded} pts</div>

        <div className="cp-congrats-rank">
          <span className="cp-congrats-rank-icon">{rank.icon}</span>
          <div>
            <div className="cp-congrats-rank-name">{rank.name}</div>
            <div className="cp-congrats-rank-total">{totalPoints} total points</div>
          </div>
        </div>

        {nextRank ? (
          <div className="cp-congrats-progress">
            <div className="cp-congrats-progress-label">
              {toNext} pts to {nextRank.icon} {nextRank.name}
            </div>
            <div className="cp-congrats-progress-track">
              <div className="cp-congrats-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="cp-congrats-maxrank">Maximum rank achieved!</div>
        )}

        <div className="cp-congrats-actions">
          <button className="cp-congrats-btn-primary" onClick={() => { onClose(); navigate('profile'); }}>
            My profile →
          </button>
          <button className="cp-congrats-btn-secondary" onClick={() => { onClose(); navigate('search'); }}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasePage({ caseData: initialData, navigate }) {
  const { apiFetch, isAuthenticated, user, updateUser } = useAuth();
  const [data, setData]       = useState(initialData);
  const [evidence, setEvidence] = useState({});   // { type: most-recent-row }
  const [collecting, setCollecting] = useState(null);
  const [errors, setErrors]     = useState({});
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null); // { data, formData|null }
  const [lestradeOpen, setLestradeOpen] = useState(false);
  const [solveError, setSolveError]   = useState(null);
  const [solving, setSolving]         = useState(false);
  const [solveSuccess, setSolveSuccess] = useState(false);
  const [pendingModeration, setPendingModeration] = useState(!!initialData.pending_submission_id);
  const [locationHint, setLocationHint] = useState(initialData.location_hint || '');
  const [hintSaving, setHintSaving]     = useState(false);
  const [hintSaved, setHintSaved]       = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting]       = useState(false);
  const [solveModal, setSolveModal]     = useState(null);

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
      if (!res.ok) throw new Error(data.error || data.message || `Collection failed (${res.status})`);
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
        body: JSON.stringify({
          descriptor:      data.descriptor,
          merchantName:    modalData.merchant_name,
          merchantLocation: modalData.location   ?? null,
          logoUrl:          modalData.logo_url    ?? null,
          evidenceType:     type,
        }),
      });
      const subBody = await subRes.json();
      if (!subRes.ok) throw new Error(subBody.error || 'Failed to submit match');

      setConfirmModal(null);

      if (subBody.approved) {
        const pointsAwarded = subBody.pointsAwarded ?? 10;
        const newTotal      = (user?.total_points ?? 0) + pointsAwarded;
        updateUser({ total_points: newTotal });
        const caseRes  = await fetch(`/api/cases/${initialData.id}`);
        const caseBody = await caseRes.json();
        if (caseBody.case) setData(caseBody.case);
        setSolveModal({ pointsAwarded, totalPoints: newTotal });
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

  async function resetInvestigation() {
    setResetting(true);
    try {
      await apiFetch(`/api/cases/${initialData.id}/evidence`, { method: 'DELETE' });
      setEvidence({});
      setActiveStepIdx(0);
      setPendingModeration(false);
      setSolveSuccess(false);
      setResetConfirm(false);
      const caseRes  = await fetch(`/api/cases/${initialData.id}`);
      const caseBody = await caseRes.json();
      if (caseBody.case) setData(caseBody.case);
    } catch {
      // non-critical
    } finally {
      setResetting(false);
    }
  }

  async function saveHint() {
    setHintSaving(true);
    try {
      await apiFetch(`/api/cases/${initialData.id}/hint`, {
        method: 'PATCH',
        body: JSON.stringify({ location_hint: locationHint }),
      });
      setHintSaved(true);
      setTimeout(() => setHintSaved(false), 2500);
    } catch {
      // silently fail — non-critical
    } finally {
      setHintSaving(false);
    }
  }

  const status              = data.computed_status || 'open';
  const isSolved            = status === 'solved';
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
                ? usedSteps.map(s => s.key === 'web_intelligence' ? `${s.label} by Inspector Lestrade` : s.label).join(' and ')
                : 'community investigation';
              const sb   = data.solved_by;
              const rank = sb ? getCurrentRank(sb.total_points ?? 0) : null;
              const name = sb ? (sb.last_name || sb.username) : null;
              const date = sb ? new Date(sb.solved_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
              return (
                <>
                  Case closed.{data.solved_merchant_name ? <> The descriptor <strong>&ldquo;{data.descriptor}&rdquo;</strong> was identified as <strong>{data.solved_merchant_name}</strong>.</> : ' This descriptor has been matched to a merchant.'}{' '}
                  Cracked using {how}.
                  {sb && (
                    <div className="cp-solved-by">
                      <span className="cp-solved-by-label">Solved by</span>
                      <span className="cp-solved-by-name">{rank.icon} {rank.name} {name}</span>
                      <span className="cp-solved-by-label">·</span>
                      <span className="cp-solved-by-label">{date}</span>
                    </div>
                  )}
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

      <div className="cp-card">
        <div className="cp-hint-label">Location clues</div>
        <p className="cp-hint-sub">
          Do you remember where this charge might have occurred? A city, neighbourhood, type of venue,
          or any other context can help narrow down the merchant.
        </p>
        <textarea
          className="cp-hint-textarea"
          placeholder="e.g. Used a parking machine in central London last Tuesday, or online purchase from a US-based store…"
          value={locationHint}
          onChange={e => setLocationHint(e.target.value)}
          disabled={!isAuthenticated || hintSaving || isSolved}
        />
        <div className="cp-hint-footer">
          {isAuthenticated && !isSolved ? (
            <>
              <button
                className="cp-hint-save"
                onClick={saveHint}
                disabled={hintSaving || locationHint === (data.location_hint || '')}
              >
                {hintSaving ? 'Saving…' : 'Save note'}
              </button>
              {hintSaved && <span className="cp-hint-saved">✓ Saved</span>}
            </>
          ) : (!isAuthenticated && !isSolved) ? (
            <span className="cp-hint-note">Sign in to add location notes</span>
          ) : null}
        </div>
      </div>

      <div>
        <div className="cp-steps-header">
          <span className="cp-steps-title">Investigation</span>
          {isAuthenticated && !isSolved && Object.keys(evidence).length > 0 && (
            resetConfirm ? (
              <div className="cp-reset-confirm">
                <span className="cp-reset-confirm-text">Clear all evidence?</span>
                <button className="cp-reset-confirm-yes" onClick={resetInvestigation} disabled={resetting}>
                  {resetting ? 'Resetting…' : 'Yes, start again'}
                </button>
                <button className="cp-reset-confirm-no" onClick={() => setResetConfirm(false)} disabled={resetting}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="cp-reset-btn" onClick={() => setResetConfirm(true)}>
                ↺ Start again
              </button>
            )
          )}
        </div>
        <div className="cp-steps">
          {STEPS.map((step, idx) => {
            const ev           = evidence[step.key];
            const hasData      = !!ev;
            const isReadOnly   = isSolved || isPendingModeration;
            const prevDone     = idx === 0 || !!evidence[STEPS[idx - 1].key];
            const isLocked     = !prevDone;
            const isOpen       = idx <= activeStepIdx || (isPendingModeration && step.key === 'local_knowledge');
            const isNext       = idx < STEPS.length - 1;
            const isCollecting = collecting === step.key;
            const isCta        = !hasData && !isLocked && !isReadOnly && idx === activeStepIdx;

            // Solved case: hide steps that produced no evidence
            if (isSolved && !hasData) return null;

            return (
              <div key={step.key} className={`cp-step${hasData ? ' has-data' : ''}${isLocked && !isReadOnly ? ' locked' : ''}${isCta ? ' is-cta' : ''}`}>
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
                  {isCta && <span className="cp-start-badge">→ Start here</span>}
                  {!isReadOnly && isLocked && <span className="cp-step-lock">Locked</span>}
                  {hasData && <span className="cp-step-done">✓ Done</span>}
                </div>

                {isOpen && <div className="cp-step-body">
                  {step.intro && <p className="cp-step-intro">{step.intro}</p>}
                  {hasData ? (
                    <>
                      <EvidenceResults ev={ev} />
                      {step.agent && (
                        <div className="cp-agent-filed">
                          <img
                            className="cp-agent-avatar"
                            src={`data:image/svg+xml;base64,${btoa(LESTRADE_SVG)}`}
                            alt={step.agent.name}
                            onClick={() => setLestradeOpen(true)}
                          />
                          <span className="cp-agent-filed-text">
                            Filed by{' '}
                            <button onClick={() => setLestradeOpen(true)}>{step.agent.name}</button>
                            , {step.agent.division}
                          </span>
                        </div>
                      )}
                      {!isReadOnly && (
                        <div className="cp-step-actions">
                          <p className="cp-solve-hint">If this is the correct merchant, click <strong>Accept &amp; Solve</strong> to lock it in and claim points towards your next promotion. If this doesn't look correct, continue to the next step in the investigation.</p>
                          <div className="cp-step-actions-row">
                            <button className="cp-solve-btn" onClick={() => openConfirm(step.key)}>
                              {step.key === 'local_knowledge' ? 'Send for review →' : 'Accept & solve case →'}
                            </button>
                            {isNext && activeStepIdx === idx && (
                              <>
                                <span style={{ fontSize: '.65rem', color: 'var(--text-dim)' }}>or</span>
                                <button className="cp-next-btn" onClick={() => setActiveStepIdx(idx + 1)}>
                                  Continue to {STEPS[idx + 1].label} ↓
                                </button>
                              </>
                            )}
                          </div>
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
                            className={`cp-collect-btn${isCta ? ' cta' : ''}`}
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

      {lestradeOpen && <LestradeModal onClose={() => setLestradeOpen(false)} />}
      {confirmModal && (
        <ConfirmModal
          modal={confirmModal}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirmModal(null); setSolveError(null); }}
          confirming={solving}
          error={solveError}
        />
      )}
      {solveModal && (
        <CongratulationsModal
          modal={solveModal}
          onClose={() => setSolveModal(null)}
          navigate={navigate}
        />
      )}
    </>
  );
}
