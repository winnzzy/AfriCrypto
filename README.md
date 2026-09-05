<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e2049ddf-e845-4147-a97e-9152757a0085

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and adjust if needed —
   by default it just points `API_BASE_URL` at the backend.
3. Start the backend (see [backend/README.md](backend/README.md)) — it listens on
   `http://localhost:3000/api` by default.
4. Run the app:
   `npm run dev` (serves on `http://localhost:5173`)

Market analysis (AI commentary on a coin's trend) needs a Gemini API key —
that's a **backend-only** setting now (`GEMINI_API_KEY` in
[backend/.env.example](backend/.env.example)); the frontend never sees the
key and the feature is simply unavailable without it.

The app now requires a running backend and an account — sign up or log in on
first load. Wallet/transaction data and sending crypto go through the real
backend; P2P trading and bill payments are still mocked for now.
