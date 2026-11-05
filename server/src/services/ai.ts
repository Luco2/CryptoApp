import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface Suggestion {
  symbol: string;
  name: string;
  reason: string;
  broker: 'alpaca' | 'coinbase';
  frequency: 'daily' | 'weekly' | 'monthly';
  amount: number;
}

export interface SuggestionsResponse {
  conservative: Suggestion[];
  moderate: Suggestion[];
  aggressive: Suggestion[];
  generatedAt: string;
}

const SYSTEM_PROMPT = `You are a financial assistant for a DCA (dollar-cost averaging) investing app.
Return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

Schema:
{
  "conservative": [ ...3 suggestions ],
  "moderate":     [ ...3 suggestions ],
  "aggressive":   [ ...3 suggestions ]
}

Each suggestion:
{
  "symbol":    "ticker symbol, e.g. SPY or BTC",
  "name":      "full name, e.g. S&P 500 ETF",
  "reason":    "one sentence, max 12 words, why it suits DCA",
  "broker":    "alpaca" for stocks/ETFs, "coinbase" for crypto,
  "frequency": "daily" | "weekly" | "monthly",
  "amount":    suggested USD amount per purchase, integer 5-50
}

Guidelines:
- conservative: broad ETFs and blue-chip stocks, maybe Bitcoin as digital gold
- moderate:     mix of individual stocks and established crypto (BTC/ETH)
- aggressive:   high-growth individual stocks and altcoins
- Vary frequency sensibly (volatile assets → daily/weekly, stable → weekly/monthly)
- Keep amounts small and beginner-friendly ($5–$25 for aggressive, $10–$50 for conservative)`;

export async function getInvestmentSuggestions(): Promise<SuggestionsResponse> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: 'Give me DCA suggestions for all three risk levels.' }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
  // Strip markdown code fences if present
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(text);
  return { ...parsed, generatedAt: new Date().toISOString() };
}
