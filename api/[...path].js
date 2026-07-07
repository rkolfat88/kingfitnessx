// Vercel serverless entry.
// Vercel routes every /api/* request to this catch-all function, preserving the
// full path (e.g. /api/chat, /api/webhooks/stripe), and the Express app from
// server.js handles the routing exactly as it does locally.
//
// Imports the esbuild bundle (built by `npm run build:server`), not server.js
// directly — server.js imports its TS modules (src/lib/agents/, coaching-rules/)
// with literal .ts extensions, which only resolve under tsx (local dev). Plain
// Node on Vercel can't resolve those at runtime, so the bundle inlines them.
import app from '../server.bundle.js';

export default app;
