import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const { asset, broker, limit } = req.query as {
    asset?: string;
    broker?: string;
    limit?: string;
  };

  const trades = await db.trade.findMany({
    where: {
      ...(asset && { asset: asset.toUpperCase() }),
      ...(broker && { broker }),
    },
    orderBy: { executedAt: 'desc' },
    take: limit ? Number(limit) : 100,
    include: { rule: { select: { frequency: true } } },
  });
  res.json(trades);
});

export default router;
