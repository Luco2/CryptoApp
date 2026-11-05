import Alpaca from '@alpacahq/alpaca-trade-api';
import { getSettings } from './settings';

async function client() {
  const s = await getSettings();
  return new Alpaca({
    keyId: s.alpacaKey,
    secretKey: s.alpacaSecret,
    paper: s.alpacaPaper,
  });
}

export async function getAlpacaAccount() {
  const alpaca = await client();
  return alpaca.getAccount();
}

export async function getAlpacaPositions() {
  const alpaca = await client();
  return alpaca.getPositions();
}

export async function getAlpacaPrice(symbol: string): Promise<number> {
  const alpaca = await client();
  const result = await alpaca.getLatestTrade(symbol) as any;
  // SDK wraps the trade: { trade: { p: price } } or returns trade directly
  const trade = result?.trade ?? result;
  return Number(trade?.p ?? trade?.Price ?? 0);
}

export async function placeAlpacaMarketOrder(symbol: string, notional: number): Promise<{
  id: string;
  qty: number;
  price: number;
}> {
  const alpaca = await client();
  const order = await alpaca.createOrder({
    symbol,
    notional: notional.toString(),
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  });
  // For paper orders qty/filled_avg_price may be null until filled; use notional fallback
  const price = Number(order.filled_avg_price ?? order.limit_price ?? 0);
  const qty = price > 0 ? notional / price : 0;
  return { id: order.id, qty, price };
}

export async function testAlpacaConnection(): Promise<{ ok: boolean; error?: string }> {
  const s = await getSettings();
  if (!s.alpacaKey || !s.alpacaSecret) return { ok: false, error: 'API key and secret are not saved yet.' };
  try {
    await getAlpacaAccount();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
