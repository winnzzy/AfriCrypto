# AfriCrypto Backend

NestJS + Prisma + PostgreSQL API for AfriCrypto. Scaffolded to match the data
shapes the frontend already expects from `/types.ts` (`WalletData`,
`Transaction`, `P2POffer`, `UserProfile`, `Biller`, ...) — see
[`prisma/schema.prisma`](prisma/schema.prisma) for how each interface maps to
a table.

The frontend's `services/apiService.ts` calls this for auth, wallets, and
transactions; P2P and bill payments are still mocked on the frontend for now.

## Modules

- `auth` — signup/login, access + refresh JWT issuance, `passport-jwt` guard (see Authentication below)
- `users` — user profile (`UserProfile` shape)
- `wallets` — crypto/fiat balances (`WalletData` shape), send crypto, receive address
- `transactions` — transaction history (`Transaction` shape)
- `p2p` — P2P offers and trade initiation (`P2POffer` shape)
- `bills` — bill categories/billers and bill payment (`BillCategory`/`Biller` shapes)
- `market` — proxies AI market commentary through Gemini (see below) so the API key never reaches the browser

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) — or your own Postgres instance

## Getting started

```bash
cd backend
cp .env.example .env      # already done for local dev; adjust if needed
npm install
docker compose up -d      # starts Postgres on localhost:5433
npm run prisma:migrate    # creates tables from prisma/schema.prisma
npm run prisma:seed       # seeds bill categories/billers
npm run start:dev
```

The API listens on `http://localhost:3000/api`. Health check:

```
GET http://localhost:3000/api/health
```

## Authentication

- `POST /api/auth/signup` — `{ email, password, country }` → `{ accessToken, refreshToken, profile }`. Username is derived from the email's local part; change it later via `PATCH /api/users/me`.
- `POST /api/auth/login` — `{ email, password }` → same shape as signup.
- `POST /api/auth/refresh` — `{ refreshToken }` → `{ accessToken, refreshToken }`. Refresh tokens are single-use: each call revokes the one it consumed and issues a new one (rotation). Presenting an already-consumed or forged token revokes every active session for that user as a precaution.
- Every other route requires `Authorization: Bearer <accessToken>` — enforced by a global `JwtAuthGuard` (see `AppModule`'s `APP_GUARD` provider). A route opts out with `@Public()` (used by `auth` and `health`).
- The access token payload is `{ sub, email, country }`. `country` rides along on the token specifically so the frontend can branch on it (currency, payment methods) without an extra `/users/me` round trip — pull it via `@CurrentUser('country')`.
- Passwords are hashed with bcrypt (cost factor 10); refresh tokens are stored hashed too, never in plaintext.

## Environment variables

See [`.env.example`](.env.example). Never commit real secrets — `.env` is
gitignored. `JWT_SECRET` and `JWT_REFRESH_SECRET` must both be replaced with
real, distinct secrets outside local development. `GEMINI_API_KEY` is
optional (see Market analysis above).

## Prisma workflow

- `npm run prisma:migrate` — create/apply a migration in dev (prompts for a migration name on schema changes)
- `npm run prisma:deploy` — apply existing migrations (CI/production)
- `npm run prisma:studio` — browse the database
- `npm run prisma:seed` — re-run the seed script

## Wallets & transactions

All balances live in Postgres per-user (`CryptoAsset`/`FiatAsset` tables) —
nothing is held in memory, so balances survive restarts and are consistent
across requests. This is still **simulated custody**: no real blockchain
broadcast happens anywhere yet.

- `GET /api/wallets` — returns the `WalletData` shape (totals, `crypto`,
  `fiat`, `dailyChangePercent`) computed live from the DB.
- `POST /api/wallets/send` — `{ cryptoSymbol, recipientAddress, amount, memo? }`.
  Atomically (single DB transaction): validates balance, decrements it,
  inserts the transaction as `PENDING`, then flips it to `COMPLETED` and
  returns it — the same lifecycle the old mock simulated with a delay.
  Settlement is instant for now; once a real custody provider is wired in,
  its confirmation (webhook/poll) should drive the `PENDING` → `COMPLETED`
  transition instead of doing it inline here.
- `GET /api/wallets/receive/:cryptoSymbol` — placeholder deposit address (see
  below), not a real on-chain address.
- `GET /api/transactions` — paginated, `?page=` (default 1) and `?limit=`
  (default 20, max 100). The **response body stays a plain `Transaction[]`**
  matching `types.ts` exactly, so it's a drop-in swap for the existing
  frontend call; pagination metadata (`X-Total-Count`, `X-Page`, `X-Limit`,
  `X-Total-Pages`) rides on response headers instead, for callers that want it.
- `GET /api/transactions/:id` — single transaction, 404 if not found or not owned by the caller.

## Market analysis

- `GET /api/market/trend/:cryptoSymbol` — an AI-generated paragraph on recent
  price/news trends for the given symbol, via the Gemini API. Requires
  `GEMINI_API_KEY` (see below); without it the endpoint returns 503 instead of
  the app failing to boot. This exists specifically so the Gemini key is only
  ever read server-side — the old frontend-only version called Gemini
  directly from the browser, which meant the key shipped inside the client
  bundle. Never add a Gemini key to the frontend's env again.

## Notes / known placeholders

- `WalletsService.getReceiveAddress` returns a deterministic placeholder
  string, not a real on-chain address — real custody/HD-wallet integration
  is a follow-up.
- `P2pService.initiateTrade` records a pending transaction but does not
  implement escrow/settlement.
- New users are provisioned with zero balances for each supported crypto
  asset plus their country's fiat currency (see `src/common/default-assets.ts`).
