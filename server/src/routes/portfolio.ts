import { Router } from 'express';
import { getPortfolio } from '../services/portfolio';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const portfolio = await getPortfolio();
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

export default router;
