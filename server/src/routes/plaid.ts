import { Router } from 'express';
import {
  isConfigured, createLinkToken, exchangePublicToken,
  getLinkedAccounts, unlinkAccount, refreshAllBalances,
} from '../services/plaid';

const router = Router();

// Serve the Plaid Link HTML page — opened in the mobile browser
router.get('/link-page', async (req, res) => {
  if (!isConfigured()) return res.status(503).send('<h2>Plaid is not configured on the server.</h2>');
  try {
    const token = await createLinkToken();
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui; display:flex; align-items:center; justify-content:center;
           min-height:100vh; margin:0; background:#0f0f14; color:#fff; text-align:center; padding:24px; }
    h2 { font-size:22px; margin-bottom:8px; }
    p  { color:#888; font-size:14px; }
  </style>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
</head>
<body>
  <div id="msg"><h2>Connecting to your bank…</h2><p>A secure window will open shortly.</p></div>
  <script>
    const handler = Plaid.create({
      token: '${token}',
      onSuccess: function(public_token, metadata) {
        document.getElementById('msg').innerHTML = '<h2>Linking account…</h2><p>Please wait.</p>';
        fetch('/plaid/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token, metadata })
        })
        .then(r => r.json())
        .then(() => {
          document.getElementById('msg').innerHTML =
            '<h2>✅ Bank connected!</h2><p>You can close this window and return to the app.</p>';
        })
        .catch(() => {
          document.getElementById('msg').innerHTML =
            '<h2>⚠️ Something went wrong.</h2><p>Please try again in the app.</p>';
        });
      },
      onExit: function(err) {
        document.getElementById('msg').innerHTML =
          '<h2>Cancelled</h2><p>Close this window to return to the app.</p>';
      }
    });
    handler.open();
  </script>
</body>
</html>`);
  } catch (err: any) {
    res.status(500).send(`<h2>Error: ${err.message}</h2>`);
  }
});

router.post('/exchange', async (req, res) => {
  try {
    const { public_token } = req.body;
    if (!public_token) return res.status(400).json({ error: 'public_token required' });
    const item = await exchangePublicToken(public_token);
    res.json({ success: true, itemId: item.itemId });
  } catch (err: any) {
    console.error('[plaid/exchange]', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/accounts', async (_req, res) => {
  try {
    await refreshAllBalances();
    const accounts = await getLinkedAccounts();
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/accounts/:accountId', async (req, res) => {
  try {
    await unlinkAccount(req.params.accountId);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
