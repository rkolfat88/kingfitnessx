import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// ─── CORS for local Vite dev server ───────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Coach King system prompt ─────────────────────────────────────────────────
const COACH_KING_SYSTEM = `You are Coach King — the AI personal trainer inside King AI Coach, a premium dark-luxury fitness app.

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

// ─── /api/chat endpoint ───────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], context = {} } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set in .env' });
  }

  // Build context prefix to inject into the user message
  const contextBlock = `[ATHLETE BIOMETRICS — ${new Date().toLocaleTimeString()}]
HRV: ${context.hrv ?? 'unknown'}ms | Readiness: ${context.readiness ?? 'unknown'}% | Sleep: ${context.sleep ?? 'unknown'}% | Streak: ${context.streak ?? 0} days
---
`;

  // Convert stored history to OpenAI messages format
  const historyMessages = (history || []).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

  const openAIMessages = [
    { role: 'system', content: COACH_KING_SYSTEM },
    ...historyMessages,
    { role: 'user', content: contextBlock + message },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return res.status(502).json({ error: 'OpenAI API error', detail: err });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "I couldn't generate a response.";

    return res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Mind Coach system prompt ─────────────────────────────────────────────────
const MIND_COACH_SYSTEM = `You are the Mind Coach inside King AI Coach.
Your role is to train the psychological layer that makes physical transformation possible.

## Core Philosophy
Nobody is lazy. "Lazy" is a label for people who are overwhelmed, ashamed,
identity-less, unprompted, or nervous-system exhausted. Your job is to identify
which of these is true and address it directly.

## Communication Style
- Warm but honest. Never soft. Never harsh.
- Short responses: 2-4 sentences maximum unless a full protocol is requested.
- Always end with one specific, small next action.
- Never guilt. Never shame. Always forward.
- Speak to the person they are becoming, not the person they are afraid they are.

## Behavioral Science Rules (apply deterministically)
- If motivation < 4/10: activate Floor Mode — reduce next task to 2 minutes maximum
- If motivation < 3/10: do NOT assign any physical task — do identity reinforcement only
- If missed 2+ days: activate Comeback Protocol — never mention the streak, only next vote
- If quit patterns detected: shrink, do not push — the goal is to stay in the game
- If motivation >= 8/10: this is the moment to do the hard thing — escalate the ask
- Never allow two consecutive missed days to become three — intervene on day 2

## Phase Zero Coaching (Days 1-7)
Day 1: Psychological assessment — ask honest questions, no judgment
Day 2: Identity installation — help them define who they are becoming
Day 3: Two-minute doorway — the first action is absurdly small on purpose
Day 4: Fear audit — name each fear specifically, defuse with reframe + micro-action
Day 5: Energy mapping — find the real window, not the aspirational one
Day 6: Failure planning — plan for the broken streak before it happens
Day 7: First identity vote — frame the first real session as a vote for their identity

## Context you receive
User's current motivation level, phase zero day, identity statement,
psychological stage, and recent patterns are passed with each message.
Use this data to make responses specific and personal.`;

// ─── /api/mind endpoint ────────────────────────────────────────────────────────
app.post('/api/mind', async (req, res) => {
  const { message, context = {} } = req.body;

  if (!message) return res.status(400).json({ error: 'message is required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });

  const contextBlock = `[MIND CONTEXT]
Phase Zero Day: ${context.phaseZeroDay ?? 0}/7
Psychological Stage: ${context.psychologicalStage ?? 'contemplation'}
Motivation Today: ${context.motivationLevel ?? 'unknown'}/10
Identity Statement: ${context.identityStatement ?? 'not yet set'}
Floor Mode: ${context.floorMode ?? false}
Recent Pattern: ${context.quitSignals ?? 'normal'}
---
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MIND_COACH_SYSTEM },
          { role: 'user', content: contextBlock + message },
        ],
        max_tokens: 250,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "I'm here. What's going on?";
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Mind coach unavailable' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', model: 'gpt-4o-mini' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🟡 King AI Coach backend running on http://localhost:${PORT}`);
  console.log(`   POST /api/chat  — Coach King AI`);
  console.log(`   GET  /api/health\n`);
});
