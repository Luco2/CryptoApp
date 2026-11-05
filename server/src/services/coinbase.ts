import crypto from 'crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getSettings } from './settings';

const BASE = 'https://api.coinbase.com';

// Coinbase CDP keys use JWT auth (ES256), not HMAC
function buildJwt(keyName: string, rawPrivateKey: string, method: string, path: string): string {
  // Handle stored keys that use literal \n instead of real newlines
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: 'cdp',
      nbf: now,
      exp: now + 120,
      sub: keyName,
      uri: `${method.toUpperCase()} api.coinbase.com${path}`,
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: { alg: 'ES256', kid: keyName, nonce: crypto.randomBytes(16).toString('hex') } as any,
    },
  );
}

export async function coinbaseAuthHeaders(method: string, path: string): Promise<Record<string, string>> {
  const s = await getSettings();
  return {
    Authorization: `Bearer ${buildJwt(s.coinbaseKey, s.coinbaseSecret, method, path)}`,
    'Content-Type': 'application/json',
  };
}

// Uses public v2 spot price API — no auth required
export async function getCoinbasePrice(productId: string): Promise<number> {
  const res = await axios.get(`https://api.coinbase.com/v2/prices/${productId}/spot`);
  const amount = res.data?.data?.amount;
  if (!amount) throw new Error(`No price returned for ${productId}`);
  return Number(amount);
}

export async function placeCoinbaseMarketOrder(productId: string, quoteSize: number): Promise<{
  orderId: string; qty: number; price: number;
}> {
  const path = '/api/v3/brokerage/orders';
  const body = JSON.stringify({
    client_order_id: crypto.randomUUID(),
    product_id: productId,
    side: 'BUY',
    order_configuration: { market_market_ioc: { quote_size: quoteSize.toFixed(2) } },
  });
  const headers = await coinbaseAuthHeaders('POST', path);
  const res = await axios.post(`${BASE}${path}`, body, { headers });
  const order = res.data.success_response;
  const price = Number(order?.average_filled_price ?? 0);
  const qty = price > 0 ? quoteSize / price : 0;
  return { orderId: order?.order_id ?? '', qty, price };
}

export async function testCoinbaseConnection(): Promise<{ ok: boolean; error?: string }> {
  const s = await getSettings();
  if (!s.coinbaseKey || !s.coinbaseSecret) return { ok: false, error: 'API key name and private key are not saved yet.' };
  try {
    const path = '/api/v3/brokerage/accounts';
    const headers = await coinbaseAuthHeaders('GET', path);
    await axios.get(`${BASE}${path}`, { headers });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.response?.data?.message ?? e?.message ?? String(e) };
  }
}

export function toCoinbaseProductId(asset: string): string {
  const upper = asset.toUpperCase();
  if (upper.includes('-')) return upper;
  return `${upper}-USD`;
}
