import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import Anthropic from '@anthropic-ai/sdk';
import { runIntakePipeline, loadClientProfile } from './src/lib/agents/orchestrator.ts';
import { confirmIntake, correctIntake, verifyAutoLog } from './src/lib/agents/intake-agent.ts';
import { getOrRecomputeMetabolicState } from './src/lib/coaching-rules/adaptive-tdee.ts';
import { explainMetabolicState } from './src/lib/agents/metabolic-agent.ts';

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
app.use(express.json({ limit: '8mb' })); // 8mb headroom for base64-encoded meal photos

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

// user_profiles is keyed inconsistently across the existing codebase — the
// signup upsert in AuthContext sets `id`, while account delete/export and the
// Stripe webhook match on `user_id`. Try `user_id` first (majority
// convention), fall back to `id` so this works against either row shape.
async function updateUserProfileByUser(userId, fields) {
  const byUserId = await supabaseAdmin
    .from('user_profiles')
    .update(fields)
    .eq('user_id', userId)
    .select('id');
  if (byUserId.data && byUserId.data.length > 0) return byUserId;

  return supabaseAdmin
    .from('user_profiles')
    .update(fields)
    .eq('id', userId)
    .select('id');
}

// ─── Coach Richard K. system prompt ────────────────────────────────────────────
const COACH_SYSTEM = `You are Coach Richard K. — the AI personal trainer inside KFX — King Fitness Experience, a premium dark-luxury fitness app.

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

// ─── Client context for Coach Richard K. ──────────────────────────────────────
// Reads the athlete's profile, active plans, and recent check-ins so the coach
// knows who it's talking to. Returns null for brand-new users with no data yet.
async function buildClientContext(user) {
  const userId = user.id;

  const [onboardingRes, trainingRes, nutritionRes, checkinsRes] = await Promise.all([
    supabaseAdmin
      .from('onboarding_data')
      .select('goal, protocol, experience, age, weight_kg')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('training_plans')
      .select('split_type, mesocycle_week, plan_data')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    supabaseAdmin
      .from('nutrition_plans')
      .select('daily_calories, protein_g, carbs_g, fat_g, protocol')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    supabaseAdmin
      .from('daily_checkins')
      .select('checkin_date, sleep_quality, energy, soreness, adaptation_flags')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(3),
  ]);

  const onboarding = onboardingRes.data;
  const training = trainingRes.data;
  const nutrition = nutritionRes.data;
  const checkins = checkinsRes.data ?? [];

  if (!onboarding && !training && !nutrition) return null;

  const parts = [];

  const identity = [];
  const name = user.user_metadata?.full_name;
  if (name) identity.push(name);
  if (onboarding?.goal) identity.push(`goal: ${onboarding.goal}`);
  const protocol = onboarding?.protocol ?? nutrition?.protocol;
  if (protocol) identity.push(`protocol: ${protocol}`);
  if (onboarding?.experience) identity.push(`experience: ${onboarding.experience}`);
  if (onboarding?.age) identity.push(`age ${onboarding.age}`);
  if (onboarding?.weight_kg) identity.push(`${onboarding.weight_kg}kg`);
  if (identity.length) parts.push(`Client context: ${identity.join(', ')}.`);

  if (training) {
    const days = training.plan_data?.days;
    let todayLabel = '';
    if (Array.isArray(days) && days.length > 0) {
      // Same weekday → plan-day mapping used by the TRAIN and check-in screens
      const dow = new Date().getDay();
      const day = days[(dow === 0 ? 6 : dow - 1) % days.length];
      if (day?.day_name) {
        todayLabel = ` — today: ${day.day_name}${day.focus ? ` (${day.focus})` : ''}`;
      }
    }
    parts.push(`Week ${training.mesocycle_week} of ${training.split_type}${todayLabel}.`);
  }

  if (checkins.length > 0) {
    const lines = checkins.map((c) => {
      const flags = Array.isArray(c.adaptation_flags) && c.adaptation_flags.length > 0
        ? c.adaptation_flags.join('/')
        : 'none';
      return `[${c.checkin_date}] sleep ${c.sleep_quality}/5, energy ${c.energy}/5, soreness ${c.soreness}/5, flags: ${flags}`;
    });
    parts.push(`Last check-ins (most recent first): ${lines.join('; ')}.`);
  }

  if (nutrition) {
    parts.push(
      `Daily targets: ${nutrition.daily_calories} kcal, ${nutrition.protein_g}g protein, ${nutrition.carbs_g}g carbs, ${nutrition.fat_g}g fat.`
    );
  }

  return parts.join(' ');
}

// ─── /api/chat ────────────────────────────────────────────────────────────────
app.post('/api/chat', chatBurstLimiter, chatDailyLimiter, async (req, res) => {
  const { message, history = [], context = {} } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in .env' });
  }

  // Personalize the system prompt when the request carries a valid session token.
  // Any failure here degrades to the base prompt — chat must never break on context.
  let system = COACH_SYSTEM;
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { data: { user } } = await supabaseAnon.auth.getUser(authHeader.slice(7));
      if (user) {
        const clientContext = await buildClientContext(user);
        system = clientContext
          ? `${clientContext}\n\n${COACH_SYSTEM}`
          : `New client — no onboarding data or plan yet. Introduce yourself briefly and ask what they need help with.\n\n${COACH_SYSTEM}`;
      }
    } catch (err) {
      console.warn('Client context build failed, using base prompt:', err.message);
    }
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
      system,
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

// ─── Intake agent + metabolic agent routes ────────────────────────────────────
// Photos arrive as base64 in the JSON body rather than multipart — this repo
// has no multipart middleware, and base64-in-JSON covers the same need
// (client-side compression keeps images well under the 8mb body limit above)
// without adding a new dependency.

app.post('/api/agents/intake', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { mode, text, imageBase64, mediaType, mealType } = req.body ?? {};
  let input;
  if (mode === 'photo') {
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: 'photo mode requires imageBase64 and mediaType' });
    }
    input = { mode: 'photo', imageBase64, mediaType };
  } else if (mode === 'text') {
    if (!text) return res.status(400).json({ error: 'text mode requires text' });
    input = { mode: 'text', text };
  } else {
    return res.status(400).json({ error: 'mode must be "photo" or "text"' });
  }

  try {
    const result = await runIntakePipeline({ supabase: supabaseAdmin, anthropic }, user.id, input, mealType);
    return res.json(result);
  } catch (err) {
    console.error('Intake agent error:', err);
    return res.status(500).json({ error: 'Intake agent failed', detail: err.message });
  }
});

app.post('/api/agents/intake/confirm', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { estimate, mealType, patternKey } = req.body ?? {};
  if (!estimate || !patternKey) {
    return res.status(400).json({ error: 'estimate and patternKey are required' });
  }
  try {
    const logId = await confirmIntake(supabaseAdmin, user.id, estimate, mealType, patternKey);
    return res.json({ logId });
  } catch (err) {
    console.error('Intake confirm error:', err);
    return res.status(500).json({ error: 'Confirm failed', detail: err.message });
  }
});

app.post('/api/agents/intake/correct', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { aiEstimate, correctedEstimate, mealType, patternKey } = req.body ?? {};
  if (!aiEstimate || !correctedEstimate || !patternKey) {
    return res.status(400).json({ error: 'aiEstimate, correctedEstimate, and patternKey are required' });
  }
  try {
    const logId = await correctIntake(supabaseAdmin, user.id, aiEstimate, correctedEstimate, mealType, patternKey);
    return res.json({ logId });
  } catch (err) {
    console.error('Intake correct error:', err);
    return res.status(500).json({ error: 'Correction failed', detail: err.message });
  }
});

app.post('/api/agents/intake/verify', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { logId } = req.body ?? {};
  if (!logId) return res.status(400).json({ error: 'logId is required' });
  try {
    await verifyAutoLog(supabaseAdmin, user.id, logId);
    return res.json({ success: true });
  } catch (err) {
    console.error('Intake verify error:', err);
    return res.status(500).json({ error: 'Verify failed', detail: err.message });
  }
});

app.get('/api/agents/metabolic', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const profile = await loadClientProfile(supabaseAdmin, user.id);
    if (!profile) return res.status(404).json({ error: 'No onboarding data yet' });

    const state = await getOrRecomputeMetabolicState(supabaseAdmin, user.id, profile);
    const note = await explainMetabolicState(anthropic, state);
    return res.json({ state, note });
  } catch (err) {
    console.error('Metabolic agent error:', err);
    return res.status(500).json({ error: 'Metabolic agent failed', detail: err.message });
  }
});

// ─── Trial system ──────────────────────────────────────────────────────────────
const TRIAL_DAYS = 21;

// trial_ends_at is set here and only here — never client-side. Idempotent:
// a user who already has a trial (or is already a paying subscriber) gets
// their existing state back unchanged.
app.post('/api/account/start-trial', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    let { data: existing } = await supabaseAdmin
      .from('user_profiles')
      .select('id, trial_ends_at, is_pro')
      .eq('user_id', user.id)
      .maybeSingle();

    // Pre-existing signup path upserts by `id`, not `user_id` — fall back to
    // that key so this doesn't create a duplicate row for older accounts.
    if (!existing) {
      const byId = await supabaseAdmin
        .from('user_profiles')
        .select('id, trial_ends_at, is_pro')
        .eq('id', user.id)
        .maybeSingle();
      existing = byId.data;
    }

    if (existing?.trial_ends_at || existing?.is_pro) {
      return res.json({ trial_ends_at: existing.trial_ends_at ?? null, already_set: true });
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ trial_ends_at: trialEndsAt })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .upsert({ id: user.id, user_id: user.id, email: user.email, trial_ends_at: trialEndsAt });
      if (error) throw error;
    }

    return res.json({ trial_ends_at: trialEndsAt, already_set: false });
  } catch (err) {
    console.error('start-trial error:', err);
    return res.status(500).json({ error: 'Failed to start trial' });
  }
});

// ─── POST /api/stripe/create-checkout-session ─────────────────────────────────
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { plan } = req.body ?? {};
  const priceId = plan === 'annual' ? process.env.STRIPE_PRICE_ID_ANNUAL : process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!priceId) {
    return res.status(500).json({ error: `Stripe price ID not configured for plan "${plan}"` });
  }

  try {
    const origin = req.headers.origin || process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: { user_id: user.id },
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
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
    if (event.type === 'checkout.session.completed') {
      // First time we see this customer for this user — link stripe_customer_id
      // (subsequent subscription.created/deleted events match on it directly).
      const userId = event.data.object.client_reference_id;
      if (userId) {
        await updateUserProfileByUser(userId, { stripe_customer_id: customerId, is_pro: true });
      }
    } else if (event.type === 'customer.subscription.created') {
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
    console.log(`\n KFX — King Fitness Experience backend running on http://localhost:${PORT}`);
    console.log(`   POST /api/chat              — Coach Richard K. AI (10/min, 30/day)`);
    console.log(`   POST /api/agents/intake        — food intake agent (photo/text)`);
    console.log(`   POST /api/agents/intake/confirm — confirm a pending food log`);
    console.log(`   POST /api/agents/intake/correct — log a correction to an estimate`);
    console.log(`   POST /api/agents/intake/verify  — tap-to-verify an auto-log`);
    console.log(`   GET  /api/agents/metabolic      — adaptive TDEE state + coaching note`);
    console.log(`   DELETE /api/account/delete  — GDPR account deletion`);
    console.log(`   GET  /api/account/export    — GDPR data export`);
    console.log(`   POST /api/webhooks/stripe   — Stripe subscription events`);
    console.log(`   GET  /api/health\n`);
  });
}

// Exported so Vercel (api/[...path].js) can run the same app serverless.
export default app;
