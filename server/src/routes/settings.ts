import { Router } from 'express';
import { getSettings, updateSettings } from '../services/settings';
import { testAlpacaConnection } from '../services/alpaca';
import { testCoinbaseConnection } from '../services/coinbase';

const router = Router();

router.get('/', async (_req, res) => {
  const settings = await getSettings();
  // Never return raw secrets to the client
  res.json({
    alpacaKey: settings.alpacaKey ? '••••' + settings.alpacaKey.slice(-4) : '',
    alpacaSecretSet: settings.alpacaSecret.length > 0,
    alpacaPaper: settings.alpacaPaper,
    coinbaseKey: settings.coinbaseKey ? '••••' + settings.coinbaseKey.slice(-4) : '',
    coinbaseSecretSet: settings.coinbaseSecret.length > 0,
    coinbasePaper: settings.coinbasePaper,
  });
});

router.put('/', async (req, res) => {
  const { alpacaKey, alpacaSecret, alpacaPaper, coinbaseKey, coinbaseSecret, coinbasePaper } = req.body;
  await updateSettings({
    ...(alpacaKey !== undefined && { alpacaKey }),
    ...(alpacaSecret !== undefined && { alpacaSecret }),
    ...(alpacaPaper !== undefined && { alpacaPaper: Boolean(alpacaPaper) }),
    ...(coinbaseKey !== undefined && { coinbaseKey }),
    ...(coinbaseSecret !== undefined && { coinbaseSecret }),
    ...(coinbasePaper !== undefined && { coinbasePaper: Boolean(coinbasePaper) }),
  });
  res.json({ success: true });
});

router.post('/test/alpaca', async (_req, res) => {
  const result = await testAlpacaConnection();
  res.json({ connected: result.ok, error: result.error });
});

router.post('/test/coinbase', async (_req, res) => {
  const result = await testCoinbaseConnection();
  res.json({ connected: result.ok, error: result.error });
});

export default router;
