import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // 5173 (Vite's default) rather than 3000 — the backend (see /backend)
        // listens on http://localhost:3000 by default, and the two can't
        // both bind the same port when running side by side in local dev.
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // GEMINI_API_KEY is deliberately NOT exposed here — Gemini calls now
        // go through the backend's /market proxy (see backend/src/market),
        // so the key only ever needs to live in the backend's env. Defining
        // it here would bake it into the client bundle for anyone to read.
        'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:3000/api'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
