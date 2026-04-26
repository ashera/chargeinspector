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
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Design a simple SVG logo (viewBox="0 0 100 100") for this merchant:
Name: ${merchantName}
Type: ${businessType || 'Business'}
${description ? `Context: ${description}` : ''}

Rules:
- Use a dark background (fill the full 100x100 with a rounded rect or circle in a dark hue matching the business)
- Place a bold single initial letter or a minimal icon in the centre in white or a light accent colour
- Maximum 2 colours total
- Use a <text> element with font-family="sans-serif" font-weight="bold" for the letter if using text
- Return ONLY raw SVG markup, no explanation, no markdown fences`,
    }],
  });

  const text = response.content[0]?.text?.trim();
  if (!text) return null;

  // Strip markdown fences and extract the <svg>...</svg> element
  const stripped  = text.replace(/^```(?:svg|xml)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const svgMatch  = stripped.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) {
    console.error('[generateLogoSvg] no <svg> element found in response for:', merchantName, '| response snippet:', text.slice(0, 200));
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
      max_tokens: 2048,
      system,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: userMessage }],
    },
    { headers: { 'anthropic-beta': 'web-search-2025-03-05' } },
  );

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
    throw new Error('Agent response did not contain JSON');
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
    ).catch(() => null);
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
