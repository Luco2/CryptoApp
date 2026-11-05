import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import portfolioRouter from './routes/portfolio';
import rulesRouter from './routes/rules';
import tradesRouter from './routes/trades';
import settingsRouter from './routes/settings';
import suggestionsRouter from './routes/suggestions';
import plaidRouter from './routes/plaid';
import fundingRouter from './routes/funding';
import { startScheduler } from './services/scheduler';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use('/portfolio', portfolioRouter);
app.use('/rules', rulesRouter);
app.use('/trades', tradesRouter);
app.use('/settings', settingsRouter);
app.use('/suggestions', suggestionsRouter);
app.use('/plaid', plaidRouter);
app.use('/funding', fundingRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScheduler();
});
