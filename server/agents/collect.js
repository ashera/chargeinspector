'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const PROMPTS = {
  web_intelligence: `You are Inspector Lestrade, head of Scotland Yard's Web Intelligence Division. You identify the merchants behind credit card billing descriptors through methodical open-source investigation.

Search the web broadly for this descriptor. Look for:
- The exact business or merchant name behind it
- What type of business it is (SaaS, retail, restaurant, utility, etc.)
- The merchant's location (city and country for physical businesses; "Online" for digital-only services)
- A direct URL to the merchant's logo image from their official website only (e.g. https://example.com/assets/logo.png). Do NOT use third-party logo APIs such as Clearbit, Brandfetch, or similar services — only return a URL if you found it directly on the merchant's own web pages
- Official company pages, press mentions, or any web presence matching the descriptor
- Any confirmed associations reported online

Cast the net wide — also search:
- GitHub repositories, READMEs, and issues where developers mention this descriptor in billing or payment contexts
- Reddit threads (r/personalfinance, r/cscareerquestions, r/webdev, etc.) where users discuss or question this charge
- Consumer complaint boards and review sites (Trustpilot, BBB, Yelp, Trustpilot) where the descriptor appears
- Developer documentation, pricing pages, and API billing guides that reference this descriptor

Write your description in Lestrade's voice: formal, methodical, confident in the legwork. First person ("My investigation confirms...", "I've traced this descriptor to...", "Scotland Yard's inquiry has established..."). 2-3 sentences. If nothing was found, Lestrade reports the dead end with characteristic bluntness.

Respond with ONLY a valid JSON object — no markdown fences, no other text:
{
  "merchant_name": "Name of identified merchant, or null if genuinely unknown",
  "confidence": "high|medium|low",
  "business_type": "Short description of business type",
  "location": "City and country e.g. 'London, UK', or 'Online' for digital services, or null if unknown",
  "logo_url": "Direct URL to the merchant's logo image, or null if not found",
  "description": "Lestrade's report in his voice: 2-3 sentences on what was found and the evidence behind it",
  "sources": [{ "url": "https://...", "title": "Brief source description" }]
}`,
};

async function generateLogoSvg(merchantName, businessType, description) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Output a single SVG element (viewBox="0 0 100 100") as raw markup — no prose, no markdown fences, nothing else before or after the tag.

Merchant: ${merchantName}
Type: ${businessType || 'Business'}
${description ? `Context: ${description}` : ''}

Design rules:
- Full 100×100 rounded-rect background in a dark colour that suits the business type
- Centred bold initial letter in white using <text x="50" y="67" font-family="Arial,sans-serif" font-weight="bold" font-size="52" text-anchor="middle" fill="white">
- Two colours maximum
- Start your response with <svg and end it with </svg>`,
    }],
  });

  const text = response.content[0]?.text?.trim();
  if (!text) {
    console.error('[generateLogoSvg] empty response for:', merchantName);
    return null;
  }

  // Remove any markdown code fences wherever they appear
  const cleaned  = text.replace(/```(?:svg|xml)?/gi, '').replace(/```/g, '').trim();
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (!svgMatch) {
    console.error('[generateLogoSvg] no <svg>...</svg> found for:', merchantName, '| snippet:', text.slice(0, 300));
    return null;
  }

  return `data:image/svg+xml;base64,${Buffer.from(svgMatch[0]).toString('base64')}`;
}

async function collectEvidence(type, descriptor, { location_hint } = {}) {
  const system = PROMPTS[type];
  if (!system) throw new Error(`Unknown evidence type: ${type}`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const hint = location_hint?.trim();
  const userMessage = hint
    ? `Investigate this credit card billing descriptor: "${descriptor}"\n\nLocation context from the investigator: "${hint}"\nUse this to help narrow down where the charge may have occurred and identify the merchant.`
    : `Investigate this credit card billing descriptor: "${descriptor}"`;

  const response = await client.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: userMessage }],
    },
    { headers: { 'anthropic-beta': 'web-search-2025-03-05' } },
  );

  if (response.stop_reason === 'max_tokens') {
    console.warn('[collectEvidence] Response hit max_tokens — output may be truncated');
  }

  // The model often emits a short preamble text block before searching, then a
  // final text block with the JSON.  Search all text blocks from last to first.
  const textBlocks = response.content.filter(b => b.type === 'text' && b.text?.trim());

  let result = null;
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const raw   = textBlocks[i].text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      result = JSON.parse(match[0]);
      break;
    } catch {
      // malformed — try an earlier block
    }
  }

  if (!result) {
    console.error('[collectEvidence] Could not extract JSON. stop_reason=%s blocks=%s',
      response.stop_reason,
      JSON.stringify(response.content.map(b => ({ type: b.type, len: b.text?.length ?? 0 }))),
    );
    throw new Error('Agent response did not contain valid JSON');
  }

  // Reject URLs from third-party logo aggregators — they are unreliable or shut down
  const LOGO_API_BLOCKLIST = ['clearbit.com', 'brandfetch.com', 'logo.dev', 'logoapi.com'];
  let logoUrl = result.logo_url ?? null;
  if (logoUrl && LOGO_API_BLOCKLIST.some(host => logoUrl.includes(host))) {
    logoUrl = null;
  }

  // Fall back to a generated SVG logo when Lestrade couldn't find one
  if (!logoUrl && result.merchant_name) {
    logoUrl = await generateLogoSvg(
      result.merchant_name,
      result.business_type,
      result.description,
    ).catch(err => {
      console.error('[generateLogoSvg fallback] failed for', result.merchant_name, ':', err.message);
      return null;
    });
  }

  return {
    merchant_name: result.merchant_name ?? null,
    confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'low',
    business_type: result.business_type ?? null,
    location: result.location ?? null,
    logo_url: logoUrl,
    description: result.description ?? null,
    sources: Array.isArray(result.sources) ? result.sources.slice(0, 8) : [],
  };
}

module.exports = { collectEvidence, generateLogoSvg };
