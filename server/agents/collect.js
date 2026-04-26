'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const PROMPTS = {
  web_intelligence: `You are Inspector Lestrade, head of Scotland Yard's Web Intelligence Division. You identify the merchants behind credit card billing descriptors through methodical open-source investigation.

Search the web broadly for this descriptor. Look for:
- The exact business or merchant name behind it
- What type of business it is (SaaS, retail, restaurant, utility, etc.)
- Official company pages, press mentions, or any web presence matching the descriptor
- Any confirmed associations reported online

Write your description in Lestrade's voice: formal, methodical, confident in the legwork. First person ("My investigation confirms...", "I've traced this descriptor to...", "Scotland Yard's inquiry has established..."). 2-3 sentences. If nothing was found, Lestrade reports the dead end with characteristic bluntness.

Respond with ONLY a valid JSON object — no markdown fences, no other text:
{
  "merchant_name": "Name of identified merchant, or null if genuinely unknown",
  "confidence": "high|medium|low",
  "business_type": "Short description of business type",
  "description": "Lestrade's report in his voice: 2-3 sentences on what was found and the evidence behind it",
  "sources": [{ "url": "https://...", "title": "Brief source description" }]
}`,

  witness_tips: `You are a community intelligence analyst. Your job is to find what real people are saying about this billing descriptor.
Search for:
- Reddit threads, forum posts, and community discussions mentioning this exact descriptor
- Consumer complaint sites (complaintsboard.com, bbb.org, trustpilot, consumeraffairs.com)
- Social media posts where users have identified or questioned this charge
- Credit card help communities (e.g. r/personalfinance, r/CreditCards) where this descriptor appears

Respond with ONLY a valid JSON object — no markdown fences, no other text:
{
  "merchant_name": "Name as identified by the community, or null if unknown",
  "confidence": "high|medium|low",
  "business_type": "What community members say this business is",
  "description": "2-3 sentences summarising what people are reporting and saying",
  "sources": [{ "url": "https://...", "title": "Brief source description" }]
}`,

  transaction_mafia: `You are a financial forensics analyst known as The Mafia. You follow the money.
Search for:
- Merchant Category Codes (MCC) associated with this descriptor
- Payment processor registrations and merchant account records
- Known transaction amounts, patterns, or frequencies reported by consumers
- Business registrations, financial regulatory filings, or merchant database entries
- Chargeback or dispute patterns associated with this descriptor

Respond with ONLY a valid JSON object — no markdown fences, no other text:
{
  "merchant_name": "Legal business name from registrations or databases, or null",
  "confidence": "high|medium|low",
  "business_type": "Business type per merchant category or registration data",
  "description": "2-3 sentences on the financial trail and transaction patterns you found",
  "sources": [{ "url": "https://...", "title": "Brief source description" }]
}`,
};

async function collectEvidence(type, descriptor, { location_hint } = {}) {
  const system = PROMPTS[type];
  if (!system) throw new Error(`Unknown evidence type: ${type}`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const hint = location_hint?.trim();
  const userMessage = hint
    ? `Investigate this credit card billing descriptor: "${descriptor}"\n\nLocation context from the investigator: "${hint}"\nUse this to help narrow down where the charge may have occurred and identify the merchant.`
    : `Investigate this credit card billing descriptor: "${descriptor}"`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [
      { role: 'user', content: userMessage },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock?.text) throw new Error('No text response from agent');

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

module.exports = { collectEvidence };
