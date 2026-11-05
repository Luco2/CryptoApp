import { Router } from 'express';
import db from '../db';
import { executeRule } from '../services/scheduler';

const router = Router();

router.get('/', async (_req, res) => {
  const rules = await db.rule.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rules);
});

router.post('/', async (req, res) => {
  const { asset, amount, frequency, broker } = req.body as {
    asset: string;
    amount: number;
    frequency: string;
    broker: string;
  };

  if (!asset || !amount || !frequency || !broker) {
    return res.status(400).json({ error: 'asset, amount, frequency, and broker are required' });
  }
  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    return res.status(400).json({ error: 'frequency must be daily, weekly, or monthly' });
  }
  if (!['alpaca', 'coinbase'].includes(broker)) {
    return res.status(400).json({ error: 'broker must be alpaca or coinbase' });
  }

  const rule = await db.rule.create({
    data: { asset: asset.toUpperCase(), amount: Number(amount), frequency, broker, nextRunAt: new Date() },
  });
  res.status(201).json(rule);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { asset, amount, frequency, broker, active } = req.body;
  try {
    const rule = await db.rule.update({
      where: { id },
      data: {
        ...(asset !== undefined && { asset: asset.toUpperCase() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(frequency !== undefined && { frequency }),
        ...(broker !== undefined && { broker }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(rule);
  } catch {
    res.status(404).json({ error: 'Rule not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.rule.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Rule not found' });
  }
});

router.post('/:id/execute', async (req, res) => {
  const { id } = req.params;
  try {
    await executeRule(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Execution failed' });
  }
});

export default router;
