'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM = `You are a financial intelligence analyst specialising in identifying merchants from credit card billing descriptors.
A billing descriptor is the short text that appears on a bank or credit card statement to identify a charge.

Search the web for this descriptor. Look for:
- The exact business or merchant name behind it
- What type of business it is (e.g. SaaS subscription, retail chain, restaurant, utility)
- Community reports on Reddit, consumer complaint sites, or forums mentioning this exact descriptor
- Official company pages or payment processor pages that reference the descriptor text

After your research, respond with ONLY a valid JSON object in exactly this format — no markdown fences, no other text:
{
  "merchant_name": "Name of identified merchant, or null if genuinely unknown",
  "confidence": "high",
  "business_type": "Short description of business type",
  "description": "2-3 sentences summarising what you found and the evidence behind it",
  "sources": [
    { "url": "https://example.com/page", "title": "Brief description of the source" }
  ]
}

Confidence levels:
- "high": multiple reliable sources confirm the same merchant
- "medium": some evidence found but not fully confirmed
- "low": limited, ambiguous, or conflicting information`;

async function collectWebIntelligence(descriptor) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [
      {
        role: 'user',
        content: `Identify the merchant behind this billing descriptor: "${descriptor}"`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock?.text) throw new Error('No text response from agent');

  // Strip markdown code fences if the model wrapped the JSON
  const raw = textBlock.text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Agent response did not contain JSON');

  const result = JSON.parse(jsonMatch[0]);
  return {
    merchant_name: result.merchant_name ?? null,
    confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'low',
    business_type: result.business_type ?? null,
    description: result.description ?? null,
    sources: Array.isArray(result.sources) ? result.sources.slice(0, 8) : [],
  };
}

module.exports = { collectWebIntelligence };
