import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

// Production safety guard — BYPASS_AUTH must never be set in production
if (process.env.NODE_ENV === 'production' && process.env.BYPASS_AUTH === 'true') {
  throw new Error('BYPASS_AUTH cannot be enabled in production');
}

// ─── Supabase clients ─────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — server-side JWT verification only.
// dotenv loads VITE_SUPABASE_ANON_KEY with the full name including VITE_ prefix.
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ─── Stripe client ────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

// ─── Anthropic client ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY?.trim() });

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

// MUST be before express.json() — Stripe signature verification needs raw bytes
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGIN ?? '*').trim()
    : '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Rate limiters for /api/chat ──────────────────────────────────────────────
const chatBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    }),
});

const chatDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: 'Daily message limit reached',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    }),
});

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireAuth(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
  return user;
}

// ─── Coach Richard K. system prompt ────────────────────────────────────────────
const COACH_SYSTEM = `You are Coach Richard K. — the AI personal trainer inside King AI Coach, a premium dark-luxury fitness app.

## Persona
- Direct, confident, evidence-based. Never vague. Every recommendation has a "why."
- Address the user as an athlete. Respect their intelligence.
- Responses are concise: 2–4 sentences max unless a plan is requested.
- Never use emojis or markdown headers in responses. Plain sentences only.

## Coaching Rules (apply deterministically)
- Protein target: 2.2g × lean body mass (kg)
- Mass gain: suggest +10% caloric surplus if weight gain < 0.25% per week
- Fat loss: recommend a refeed day if weight drops > 1.5% in a week
- CNS deficit: reduce session volume by 30% if fatigue ≥ 8/10 AND sleep < 80%
- Joint pain ≥ 7/10: flag exercise substitutions — do not program that movement
- HRV below baseline (< 60ms): recommend RPE 7 cap, no PRs
- Readiness < 70%: reduce intensity, prioritize technique work
- Readiness ≥ 90%: green light for max effort / PR attempts

## Context you receive each message
The user's current biometric context is passed as a JSON block at the start of each user message. Use it to make your coaching specific and data-driven. Reference actual numbers when relevant.

## Rules
- Never break character.
- If asked something outside fitness/nutrition/recovery, redirect back to training.
- If the user is in pain or mentions injury, always add: "If pain persists, consult a sports medicine professional."
`;

// ─── /api/chat ────────────────────────────────────────────────────────────────
app.post('/api/chat', chatBurstLimiter, chatDailyLimiter, async (req, res) => {
  const { message, history = [], context = {} } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in .env' });
  }

  const contextBlock = `[ATHLETE BIOMETRICS — ${new Date().toLocaleTimeString()}]
HRV: ${context.hrv ?? 'unknown'}ms | Readiness: ${context.readiness ?? 'unknown'}% | Sleep: ${context.sleep ?? 'unknown'}% | Streak: ${context.streak ?? 0} days
---
`;

  const historyMessages = (history || []).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      system: COACH_SYSTEM,
      messages: [...historyMessages, { role: 'user', content: contextBlock + message }],
    });

    const reply = response.content.find(block => block.type === 'text')?.text?.trim()
      ?? "I couldn't generate a response.";

    return res.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error('Anthropic rate limit:', err.message);
      return res.status(429).json({ error: 'Anthropic API rate limited', detail: err.message });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error:', err.message);
      return res.status(502).json({ error: 'Anthropic API error', detail: err.message });
    }
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/account/delete ───────────────────────────────────────────────
app.delete('/api/account/delete', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = user.id;

  try {
    const tables = [
      'phase_zero_progress',
      'mind_checkins',
      'daily_checkins',
      'protocol_streaks',
      'mind_profiles',
      'training_plans',
      'user_profiles',
    ];

    for (const table of tables) {
      try {
        await supabaseAdmin.from(table).delete().eq('user_id', userId);
      } catch (e) {
        console.warn(`Delete from ${table} skipped:`, e);
      }
    }

    for (const table of ['nutrition_plans', 'onboarding_data']) {
      try {
        await supabaseAdmin.from(table).delete().eq('user_id', userId);
      } catch (_) {}
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return res.status(500).json({ error: 'Failed to delete account' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Account deletion error:', err);
    return res.status(500).json({ error: 'Account deletion failed' });
  }
});

// ─── GET /api/account/export ──────────────────────────────────────────────────
app.get('/api/account/export', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = user.id;

  const exportData = { userId, exportedAt: new Date().toISOString() };

  const tables = [
    'user_profiles',
    'mind_profiles',
    'phase_zero_progress',
    'mind_checkins',
    'daily_checkins',
    'protocol_streaks',
    'training_plans',
  ];

  for (const table of tables) {
    try {
      const { data } = await supabaseAdmin.from(table).select('*').eq('user_id', userId);
      exportData[table] = data ?? [];
    } catch (_) {
      exportData[table] = [];
    }
  }

  for (const table of ['nutrition_plans', 'onboarding_data']) {
    try {
      const { data } = await supabaseAdmin.from(table).select('*').eq('user_id', userId);
      exportData[table] = data ?? [];
    } catch (_) {
      exportData[table] = [];
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="king-ai-data-${userId.slice(0, 8)}.json"`);
  return res.json(exportData);
});

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  const customerId = event.data.object.customer;

  try {
    if (event.type === 'customer.subscription.created') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ is_pro: true })
        .eq('stripe_customer_id', customerId);
    } else if (event.type === 'customer.subscription.deleted') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ is_pro: false })
        .eq('stripe_customer_id', customerId);
    }
    return res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', model: 'claude-sonnet-5' }));

const PORT = process.env.PORT || 3001;

// Local dev / Node hosts run a long-lived server on PORT.
// On Vercel, api/[...path].js imports this `app` and runs it as a serverless
// function, so we must NOT call listen there.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n King AI Coach backend running on http://localhost:${PORT}`);
    console.log(`   POST /api/chat              — Coach Richard K. AI (10/min, 30/day)`);
    console.log(`   DELETE /api/account/delete  — GDPR account deletion`);
    console.log(`   GET  /api/account/export    — GDPR data export`);
    console.log(`   POST /api/webhooks/stripe   — Stripe subscription events`);
    console.log(`   GET  /api/health\n`);
  });
}

// Exported so Vercel (api/[...path].js) can run the same app serverless.
export default app;
