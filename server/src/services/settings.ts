import db from '../db';

export async function getSettings() {
  let settings = await db.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: 1,
        alpacaKey: process.env.ALPACA_KEY ?? '',
        alpacaSecret: process.env.ALPACA_SECRET ?? '',
        alpacaPaper: process.env.ALPACA_PAPER !== 'false',
        coinbaseKey: process.env.COINBASE_KEY ?? '',
        coinbaseSecret: process.env.COINBASE_SECRET ?? '',
        coinbasePaper: process.env.COINBASE_PAPER !== 'false',
      },
    });
  }
  return {
    ...settings,
    alpacaKey: settings.alpacaKey || process.env.ALPACA_KEY || '',
    alpacaSecret: settings.alpacaSecret || process.env.ALPACA_SECRET || '',
    coinbaseKey: settings.coinbaseKey || process.env.COINBASE_KEY || '',
    coinbaseSecret: settings.coinbaseSecret || process.env.COINBASE_SECRET || '',
  };
}

export async function updateSettings(patch: Partial<{
  alpacaKey: string;
  alpacaSecret: string;
  alpacaPaper: boolean;
  coinbaseKey: string;
  coinbaseSecret: string;
  coinbasePaper: boolean;
}>) {
  await getSettings(); // ensure row exists
  return db.settings.update({ where: { id: 1 }, data: patch });
}
