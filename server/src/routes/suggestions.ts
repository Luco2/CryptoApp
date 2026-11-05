import { Router } from 'express';
import { getInvestmentSuggestions } from '../services/ai';

const router = Router();

router.get('/', async (_req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set on the server.' });
  }
  try {
    const suggestions = await getInvestmentSuggestions();
    res.json(suggestions);
  } catch (err: any) {
    console.error('[suggestions]', err);
    res.status(500).json({ error: err.message ?? 'Failed to get suggestions' });
  }
});

export default router;
