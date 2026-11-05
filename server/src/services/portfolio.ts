import db from '../db';
import { getAlpacaPositions, getAlpacaAccount } from './alpaca';
import { getCoinbasePrice, toCoinbaseProductId } from './coinbase';
import { getSettings } from './settings';

export interface Holding {
  asset: string;
  broker: 'alpaca' | 'coinbase';
  qty: number;
  price: number;
  value: number;
  unrealizedPl: number | null;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  holdings: Holding[];
}

async function alpacaHoldings(): Promise<Holding[]> {
  try {
    const positions = await getAlpacaPositions();
    return (positions as any[]).map((p) => ({
      asset: p.symbol,
      broker: 'alpaca' as const,
      qty: Number(p.qty),
      price: Number(p.current_price),
      value: Number(p.market_value),
      unrealizedPl: Number(p.unrealized_pl),
    }));
  } catch {
    return [];
  }
}

async function coinbaseHoldings(): Promise<Holding[]> {
  // Compute simulated holdings from paper trade records
  const trades = await db.trade.findMany({ where: { broker: 'coinbase' } });

  const totals = new Map<string, { qty: number; cost: number }>();
  for (const t of trades) {
    const current = totals.get(t.asset) ?? { qty: 0, cost: 0 };
    if (t.side === 'buy') {
      current.qty += t.qty;
      current.cost += t.total;
    } else {
      current.qty -= t.qty;
      current.cost -= t.total;
    }
    totals.set(t.asset, current);
  }

  const holdings: Holding[] = [];
  for (const [asset, { qty, cost }] of totals.entries()) {
    if (qty <= 0) continue;
    let price = 0;
    try {
      price = await getCoinbasePrice(toCoinbaseProductId(asset));
    } catch {
      // price fetch failed; use avg cost basis as fallback
      price = cost / qty;
    }
    const value = qty * price;
    holdings.push({
      asset,
      broker: 'coinbase',
      qty,
      price,
      value,
      unrealizedPl: value - cost,
    });
  }
  return holdings;
}

export async function getPortfolio(): Promise<Portfolio> {
  const settings = await getSettings();

  const [alpHoldings, cbHoldings] = await Promise.all([
    settings.alpacaKey ? alpacaHoldings() : Promise.resolve([]),
    coinbaseHoldings(),
  ]);

  let cash = 0;
  if (settings.alpacaKey) {
    try {
      const account = await getAlpacaAccount();
      cash = Number((account as any).buying_power ?? 0);
    } catch {
      // ignore
    }
  }

  const holdings = [...alpHoldings, ...cbHoldings];
  const totalValue = cash + holdings.reduce((sum, h) => sum + h.value, 0);

  return { totalValue, cash, holdings };
}
