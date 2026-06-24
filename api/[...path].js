// Vercel serverless entry.
// Vercel routes every /api/* request to this catch-all function, preserving the
// full path (e.g. /api/chat, /api/webhooks/stripe), and the Express app from
// server.js handles the routing exactly as it does locally.
import app from '../server.js';

export default app;
