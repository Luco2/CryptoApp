import cron from 'node-cron';
import db from '../db';
import { getSettings } from './settings';
import { getAlpacaPrice, placeAlpacaMarketOrder } from './alpaca';
import { getCoinbasePrice, placeCoinbaseMarketOrder, toCoinbaseProductId } from './coinbase';

function addInterval(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

export async function executeRule(ruleId: string): Promise<void> {
  const rule = await db.rule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new Error(`Rule ${ruleId} not found`);

  const settings = await getSettings();

  let qty = 0;
  let price = 0;
  let mode: 'paper' | 'live' = 'paper';

  if (rule.broker === 'alpaca') {
    if (settings.alpacaKey) {
      // With keys the Alpaca SDK routes to the paper or live endpoint based on the
      // paper flag, so the mode label must follow that same flag.
      mode = settings.alpacaPaper ? 'paper' : 'live';
      const order = await placeAlpacaMarketOrder(rule.asset, rule.amount);
      qty = order.qty;
      price = order.price;
    } else {
      // No API key: this is always a local simulation, never a real order —
      // record it as paper even if the live flag is set.
      mode = 'paper';
      try { price = await getAlpacaPrice(rule.asset); } catch { price = 0; }
      qty = price > 0 ? rule.amount / price : 0;
    }
  } else {
    // coinbase: a real order only happens with live mode AND a key configured;
    // otherwise it's a local simulation and must be recorded as paper.
    const productId = toCoinbaseProductId(rule.asset);

    if (!settings.coinbasePaper && settings.coinbaseKey) {
      mode = 'live';
      const order = await placeCoinbaseMarketOrder(productId, rule.amount);
      qty = order.qty;
      price = order.price;
    } else {
      mode = 'paper';
      price = await getCoinbasePrice(productId);
      qty = price > 0 ? rule.amount / price : 0;
    }
  }

  if (price === 0 || qty === 0) {
    throw new Error(`Price lookup returned 0 for ${rule.asset}; skipping trade`);
  }

  await db.$transaction([
    db.trade.create({
      data: {
        ruleId: rule.id,
        asset: rule.asset,
        side: 'buy',
        qty,
        price,
        total: rule.amount,
        broker: rule.broker,
        mode,
      },
    }),
    db.rule.update({
      where: { id: rule.id },
      data: { nextRunAt: addInterval(new Date(), rule.frequency) },
    }),
  ]);

  console.log(`[scheduler] executed rule ${rule.id}: bought ${qty.toFixed(6)} ${rule.asset} @ ${price} (${mode})`);
}

export function startScheduler(): void {
  // runs every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const dueRules = await db.rule.findMany({
      where: { active: true, nextRunAt: { lte: now } },
    });

    for (const rule of dueRules) {
      try {
        await executeRule(rule.id);
      } catch (err) {
        console.error(`[scheduler] rule ${rule.id} failed:`, err);
      }
    }
  });

  console.log('[scheduler] started — checking rules every minute');
}
