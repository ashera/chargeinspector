'use strict';
import { useEffect } from 'react';

const APP_NAME = 'ChargeInspector';

function setMetaTag(selector, attr, value) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [a, v] = attr;
    el.setAttribute(a, v);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function useMeta({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${APP_NAME}` : APP_NAME;
    document.title = fullTitle;

    const desc = description || 'Unknown charge on your bank statement? Search our community database of billing descriptors to find out who really charged you.';

    setMetaTag('meta[name="description"]',      ['name',     'description'],   desc);
    setMetaTag('meta[property="og:title"]',      ['property', 'og:title'],      fullTitle);
    setMetaTag('meta[property="og:description"]',['property', 'og:description'],desc);
    setMetaTag('meta[name="twitter:title"]',     ['name',     'twitter:title'], fullTitle);
    setMetaTag('meta[name="twitter:description"]',['name',    'twitter:description'], desc);
  }, [title, description]);
}
