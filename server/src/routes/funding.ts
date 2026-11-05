import { Router } from 'express';
import { depositToAlpaca, depositToCoinbase, getTransferHistory } from '../services/funding';

const router = Router();

router.post('/deposit', async (req, res) => {
  const { bankAccountId, broker, amount } = req.body as {
    bankAccountId: string; broker: string; amount: number;
  };
  if (!bankAccountId || !broker || !amount) {
    return res.status(400).json({ error: 'bankAccountId, broker, and amount are required' });
  }
  try {
    let transferId: string;
    if (broker === 'alpaca') {
      transferId = await depositToAlpaca(bankAccountId, Number(amount));
    } else if (broker === 'coinbase') {
      transferId = await depositToCoinbase(bankAccountId, Number(amount));
    } else {
      return res.status(400).json({ error: 'broker must be alpaca or coinbase' });
    }
    res.json({ success: true, transferId });
  } catch (err: any) {
    console.error('[funding/deposit]', err);
    res.status(500).json({ error: err.message ?? 'Deposit failed' });
  }
});

router.get('/transfers', async (_req, res) => {
  try {
    res.json(await getTransferHistory());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
