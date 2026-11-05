# CryptoApp

Auto-investing mobile app with dollar-cost-averaging (DCA) automation for **stocks** (Alpaca) and **crypto** (Coinbase Advanced Trade). Create recurring investment rules and let a server-side scheduler execute them automatically.

> ⚠️ This app places real trades when switched to live mode. It ships defaulting to **paper mode** (simulated). Use paper mode until you understand exactly what it does. Nothing here is financial advice.

## Architecture

| Folder    | Stack |
|-----------|-------|
| `app/`    | React Native + Expo (SDK 56), TypeScript, React Navigation v7, Zustand |
| `server/` | Node.js + Express + TypeScript, Prisma + SQLite, node-cron scheduler |

**Key design points**
- API keys live **only on the server** (stored in a `Settings` DB row), never in the mobile app.
- Paper ↔ Live is a runtime toggle in the Settings screen — no code changes needed.
- DCA scheduler runs every minute (node-cron) and executes any rule whose next run is due.
- Coinbase paper mode is simulated locally from trade records — no real orders are sent.

## Prerequisites

- Node.js 18+
- npm
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator
- API keys (sandbox/paper recommended): [Alpaca](https://app.alpaca.markets), [Coinbase Advanced Trade](https://www.coinbase.com/settings/api), [Anthropic](https://console.anthropic.com), [Plaid](https://dashboard.plaid.com)

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # then fill in your keys
npm run db:push           # create the SQLite schema
npm run dev               # starts on http://localhost:3001
```

### 2. App

```bash
cd app
npm install
cp .env.example .env      # set EXPO_PUBLIC_SERVER_URL to reach your server
npx expo start
```

Set `EXPO_PUBLIC_SERVER_URL` based on how you run the app:

| Target            | URL |
|-------------------|-----|
| Android emulator  | `http://10.0.2.2:3001` |
| iOS simulator     | `http://localhost:3001` |
| Physical device   | `http://<your-machine-ip>:3001` (e.g. `http://192.168.1.50:3001`) |

Broker API keys themselves are entered in the app's **Settings** screen (they're saved server-side), not in `.env`.

## Environment variables

Both `.env` files are git-ignored. See `server/.env.example` and `app/.env.example` for the full list. The server expects: `PORT`, `ANTHROPIC_API_KEY`, `ALPACA_KEY`/`ALPACA_SECRET`/`ALPACA_PAPER`, `COINBASE_KEY`/`COINBASE_SECRET`/`COINBASE_PAPER`, and `PLAID_CLIENT_ID`/`PLAID_SECRET`/`PLAID_ENV`.

## Server API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/portfolio` | Aggregated holdings + live prices |
| GET/POST/PUT/DELETE | `/rules` | DCA rules CRUD |
| POST | `/rules/:id/execute` | Manually trigger a rule |
| GET | `/trades` | Trade history |
| GET/PUT | `/settings` | Broker keys + paper/live toggles |
| POST | `/settings/test/alpaca` | Test Alpaca connection |
| POST | `/settings/test/coinbase` | Test Coinbase connection |

## Scripts

**Server** — `npm run dev` (watch) · `npm run build` · `npm start` · `npm run db:push` · `npm run db:studio`
**App** — `npm start` · `npm run android` · `npm run ios` · `npm run web`

## Security

- Never commit `.env` files — they're git-ignored.
- Rotate any keys that get exposed.
- Keep `COINBASE_PAPER` / `ALPACA_PAPER` on until you intend to trade real money.
