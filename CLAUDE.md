# CLAUDE.md — KFX — King Fitness Experience
# ============================================
# Auto-read by Claude Code every session.
# Project root: C:\king_ai_app
# ============================================

## PROJECT

KFX — King Fitness Experience — Premium mobile-first AI fitness coaching app.
Four pillars: MIND · TRAIN · FUEL · RECOVER (+ Coach chat).

## ARCHITECTURE

```
Vite 3000 (React frontend) ←→ Express 3001 (Node backend) ←→ Anthropic API
                                                          ←→ Supabase (auth + data)
```

Two processes to run:
```
Terminal 1: npm run dev        (Vite on port 3000)
Terminal 2: npm run server     (tsx server.js — Express on port 3001)
```

Terminal 2 runs via `tsx`, not plain `node`, because server.js imports TypeScript
modules directly (src/lib/agents/, src/lib/coaching-rules/). Vercel's Node
builder compiles those transitively at deploy time, so production is
unaffected — this only matters for local dev.

### Four Pillars

- **MIND** — Default tab. Phase Zero psychological onboarding (7 sections, one-time), then Mind Gym daily check-in.
- **TRAIN** — Training plan generation and daily workout display.
- **FUEL** — Nutrition plan (macros, meals).
- **RECOVER** — Recovery tracking.
- **COACH** — AI chat (wired to server.js /api/chat → Anthropic claude-sonnet-5).

Nav order: Mind · Train · Fuel · Recover · Coach (Mind is default/landing tab).

### Phase Zero

One-time psychological onboarding — 7 sections completed over time (not 7 literal days). Builds the psychological profile used to personalize everything. Saved to `phase_zero_progress` and `mind_profiles` in Supabase.

### Deterministic Systems (NO API calls)

- Mind responses (Phase Zero + Mind Gym daily primer) are **pre-written deterministic functions** — no API, no latency, no cost. Logic lives in `PhaseZero.tsx` and `MindGym.tsx`.
- **Coaching Rules Engine** at `src/lib/coaching-engine/` — pure TypeScript, zero API calls, every output includes `reasoning[]` array ("show the math"). Modules:
  - `types.ts` — ClientProfile, DailyState, EngineOutput<T>, MacroTargets, TrainingPlan
  - `nutrition.ts` — Mifflin-St Jeor BMR → TDEE → goal adjustment → macro split. `calculateMacros(profile, tdeeOverride?)` accepts an optional adaptive TDEE override; omit it and behavior is 100% unchanged from before adaptive-tdee existed.
  - `training.ts` — split selection, exercise library, injury substitutions
  - `adapt.ts` — daily session adaptation based on morning check-in state
  - `scores.ts` — recovery, readiness, adherence, momentum, discipline, mind scores
  - `index.ts` — single export point
- **Adaptive TDEE** at `src/lib/coaching-rules/adaptive-tdee.ts` — deliberately a *separate* directory from coaching-engine, because unlike the pure engine above, this module does Supabase I/O (reads food_logs/daily_checkins, upserts metabolic_state). Deterministic math, no LLM calls. Learns estimated TDEE from logged intake + trend body weight, blended with the static Mifflin-St Jeor prior until there's enough data (see HARD RULES below). Recomputes at most weekly; `getAdaptiveMacros()` is the integration point that decides adaptive vs. static per user.

## STACK

- Vite 6 + React 19 + TypeScript
- Tailwind v4 (@tailwindcss/vite plugin, NO tailwind.config)
- Lucide React icons
- Motion (animation)
- Express + dotenv (backend server.js)
- @google/genai (Gemini SDK — installed but not yet used)
- Anthropic API (@anthropic-ai/sdk, claude-sonnet-5 — wired in server.js for Coach chat)
- Supabase (auth + data — WIRED)
- Stripe (NOT yet wired)

## AI AGENT PIPELINE

There is no historical "N specialists" pipeline to track here — this section
was written from scratch alongside the orchestrator itself; there was no
prior orchestrator, agents/ directory, or Safety Agent in the codebase before
it. Two real LLM-calling paths exist today:

1. **Coach Richard K.** (`server.js` → `POST /api/chat`) — the one existing
   persona/agent. Freeform chat, personalized via `buildClientContext()`.
2. **Intake + Metabolic pipeline** (`src/lib/agents/orchestrator.ts` →
   `POST /api/agents/intake`, `GET /api/agents/metabolic`):
   ```
   intake-agent → coaching-rules (adaptive-tdee via nutrition.ts)
                → metabolic-agent → safety-check → response
   ```
   - `intake-agent.ts` — claude-sonnet-5, vision (photo) or text. Turns a
     meal description/photo into `{items[], totals, confidence_note}`. Reads
     `agent_memory` for personal food-memory bias and "your usual?" matching;
     writes `food_logs`. Confidence-gated auto-log is the one path that
     writes without explicit confirmation — see HARD RULES.
   - `adaptive-tdee.ts` — see above; not itself LLM-calling.
   - `metabolic-agent.ts` — claude-sonnet-5, explains `metabolic_state` in
     plain language. Never calculates — all math stays in adaptive-tdee.ts.
   - `safety-check` — deterministic, inline in orchestrator.ts (no separate
     agent/service exists for this). Flags allergen conflicts between logged
     items and `onboarding_data.allergies`; re-affirms adaptive-tdee's hard
     bounds defensively. Not an LLM call.

If this pipeline grows a genuine multi-agent orchestrator or a standalone
Safety Agent later, update this section to match — don't let it go stale
the way the pre-existing sections of this file had.

## FILE STRUCTURE

```
C:\king_ai_app\
├── src\
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components\
│   │   ├── mind\
│   │   │   ├── PhaseZero.tsx       ← 7-section psychological onboarding
│   │   │   └── MindGym.tsx         ← daily check-in + mental primer
│   │   ├── Dashboard.tsx
│   │   ├── Onboarding.tsx
│   │   ├── ActiveWorkout.tsx
│   │   ├── Nutrition.tsx
│   │   ├── Progress.tsx
│   │   ├── CoachChat.tsx
│   │   ├── TrialSoftPrompt.tsx     ← day-14/day-19 soft upgrade nudge
│   │   ├── Settings.tsx
│   │   ├── FormAnalysis.tsx
│   │   ├── AuthScreen.tsx
│   │   └── ProtectedRoute.tsx      ← currently unused (App.tsx gates inline)
│   ├── screens\
│   │   ├── MindScreen.tsx          ← routes to PhaseZero or MindGym
│   │   └── UpgradeScreen.tsx       ← paywall, Stripe Checkout CTA
│   ├── contexts\
│   │   └── AuthContext.tsx         ← also owns accessState/trialDaysLeft
│   └── lib\
│       ├── supabase.ts
│       ├── feature-gate.ts         ← getAccessState/daysLeftInTrial (pure)
│       ├── coaching-engine\        ← deterministic rules engine, zero I/O
│       │   ├── types.ts
│       │   ├── nutrition.ts
│       │   ├── training.ts
│       │   ├── adapt.ts
│       │   ├── scores.ts
│       │   ├── index.ts
│       │   └── test.ts
│       ├── coaching-rules\         ← deterministic but DOES Supabase I/O
│       │   └── adaptive-tdee.ts
│       └── agents\                 ← the two LLM-calling agents + orchestrator
│           ├── types.ts
│           ├── orchestrator.ts
│           ├── intake-agent.ts
│           └── metabolic-agent.ts
├── server.js                       ← Express API (port 3001)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env                            ← ANTHROPIC_API_KEY, VITE_SUPABASE_*
```

## SUPABASE — WIRED ✅

- **Auth**: signup, login, session persistence via localStorage (`king-ai-coach-auth`)
- **RLS**: enabled on all tables
- **Project**: pdctqjrcsuldbgsijqpb
- **URL**: https://pdctqjrcsuldbgsijqpb.supabase.co

### Live Tables

Not exhaustive — several tables already in production (training_plans,
nutrition_plans, daily_checkins, protocol_streaks, onboarding_data,
workout_logs, performance_scores, insights, weekly_debriefs, training_blocks)
predate this list and aren't all documented here yet. The rows below are the
ones this file has tracked plus what this session added.

| Table | Purpose |
|---|---|
| `user_profiles` | Basic user info, onboarding_completed flag, `is_pro`, `stripe_customer_id`, `trial_ends_at` (21-day no-card trial — set server-side only, see PRICING) |
| `mind_profiles` | Phase Zero state, identity_statement, phase_zero_completed, mind_score |
| `phase_zero_progress` | Per-section responses and completion (user_id + day_number unique) |
| `mind_checkins` | Daily motivation check-ins + ai_response (user_id + checkin_date unique) |
| `food_logs` | Intake-agent output: user_id, logged_at, meal_type, items (jsonb), kcal/protein_g/carbs_g/fat_g, confidence_note, `source` ('manual'\|'auto'), `verified`. Written by intake-agent.ts — see AI AGENT PIPELINE. |
| `metabolic_state` | One row per user: estimated_tdee, trend_weight_kg, confidence, data_days, delta_explanation, updated_at. Upserted by adaptive-tdee.ts, recomputed at most weekly. |
| `agent_memory` | Per-user recurring-meal patterns for intake-agent: pattern_key, pattern_data (jsonb), confirm_count, correction_variance, last_seen_at. Drives confidence-gated auto-log — see HARD RULES. |
| `training_blocks` | Pre-existing — not touched by this session's work. |

### Supabase Patterns

- Always use `.maybeSingle()` not `.single()` — avoids 406 errors on no rows
- Always use `.upsert(..., { onConflict: '...' })` not `.insert()` — avoids 409 conflicts
- All queries filter by `user_id` (RLS enforced)

## BACKEND (server.js) — WIRED ✅

```
POST /api/chat   — Coach King AI (claude-sonnet-5)
GET  /api/health — health check
```

The `/api/mind` endpoint has been **REMOVED** — all mind responses are now deterministic functions in the frontend. Do not re-add it.

## DESIGN SYSTEM v2 — LOCKED — NEVER BREAK

> **Design system is BLACK + WHITE + LIME/NEON-GREEN.**
> The old Dark Navy + Gold palette (#070B14 bg, #C9A84C accent) is FULLY DEPRECATED.
> Do not use navy, do not use gold, do not reference the old palette in any new code.

### Colors

```
── BACKGROUNDS ──────────────────────────────────────────
bg-base:          #000000   Page canvas, app background
surface-1:        #0D0D0D   Cards, input fields
surface-2:        #141414   Elevated cards, modals, drawers
surface-3:        #1A1A1A   Hover states, selected rows
border-default:   #262626   Default card / input borders
border-strong:    #333333   Focused states, separators

── ACCENT (LIME / NEON-GREEN) ───────────────────────────
accent:           #CAFF40   CTAs, active nav, key metrics, section headers
accent-dim:       #A8D930   Pressed / active button state
accent-subtle:    #CAFF40   at 12% opacity — card tints, pill backgrounds
accent-glow:      #CAFF40   at 25% opacity — box-shadow on milestone animations
text-on-accent:   #000000   Text INSIDE lime buttons (WCAG AAA)

── TEXT (WHITE STRUCTURE) ───────────────────────────────
text-primary:     #FFFFFF   Headlines, card titles, active values
text-secondary:   #A0A0A0   Body copy, descriptions
text-muted:       #5C5C5C   Labels, placeholders, disabled

── SEMANTIC STATES — SANCTIONED EXCEPTIONS ──────────────
These four colors are universal communication conventions (green=go,
orange=caution, red=stop, blue=sleep/calm). They are NOT brand colors
and NOT accent colors. They appear only where they carry that universal
meaning — never as decoration. The "lime is the ONLY accent" rule does
not apply to this group; it applies to brand accent decisions only.

state-green:      #22C55E   Check-in complete, success states
state-orange:     #F97316   Soreness indicator, physical warning
state-red:        #EF4444   Errors, floor-mode badge, destructive actions
state-blue:       #3B82F6   Sleep quality only (calm/rest convention)
```

### Card Patterns

```
Standard card:
  bg-[#0D0D0D] border border-[#262626] rounded-2xl

Accent-tinted card (check-in complete, streak, milestones):
  bg-[#CAFF40]/[0.06] border border-[#CAFF40]/20 rounded-2xl

Left-border accent (coach quote, philosophy block):
  border-l-2 border-[#CAFF40] pl-4
```

### Fonts

```
Sans:    Plus Jakarta Sans
Display: Space Grotesk
Mono:    JetBrains Mono
```

### Layout

```
Mobile-first: max-w-[430px] centered
Sticky wordmark header
Fixed bottom navigation (z-40)
Fixed CTA buttons use z-50 to sit above nav
No sidebar
```

### Spacing

```
Cards gap:    mb-6 minimum
Section gap:  32px dividers
Page padding: px-5
Card padding: p-5
```

### Typography

```
Page title:     text-4xl font-black text-[#FFFFFF] (Space Grotesk)
Section header: text-xs font-bold uppercase tracking-widest text-[#CAFF40]
Card title:     text-base font-semibold text-[#FFFFFF]
Body:           text-sm text-[#A0A0A0]
Muted:          text-xs text-[#5C5C5C]
Mono data:      font-mono (JetBrains Mono)
CTA button:     bg-[#CAFF40] text-[#000000] font-black
```

## COACHING RULES ENGINE — RULE SET

These rules are implemented in `src/lib/coaching-engine/` and must not change without updating both the engine and this file.

```
Protein:        2.2g × lean body mass kg (LOCKED — non-negotiable)
GLP-1 users:    2.4g × lean body mass kg (muscle preservation)
Mass gain:      +300 cal above TDEE
Fat loss:       −500 cal below TDEE
Recomp:         TDEE (maintenance calories)

CNS deficit:    −30% volume if soreness ≥8 AND sleep <6h
Floor Mode:     motivation ≤3 → 1 exercise, 1 set, 5 minutes only
Reduced vol:    motivation 4–6 OR energy ≤4 → −20% volume
Peak state:     motivation ≥8 AND energy ≥7 → +1 set on first compound
High soreness:  soreness ≥7 → RPE −1 on all exercises

Activity multiplier:
  ≤2 days/week  → ×1.375
  3–4 days/week → ×1.55
  5+ days/week  → ×1.725
```

## PRICING

- **21-day no-card trial**, app-gated via `user_profiles.trial_ends_at` — no
  Stripe involvement until conversion (no `trial_period_days` on the Stripe
  side).
- `trial_ends_at` is set exactly once, server-side only, by
  `POST /api/account/start-trial` (idempotent — a user who already has a
  trial or is already `is_pro` gets their existing state back unchanged).
  Never set client-side.
- Access state (`src/lib/feature-gate.ts` → `getAccessState()`): `subscribed`
  (is_pro) > `trialing` (trial_ends_at in the future) > `expired`.
- **Expired = read-only**, not locked out: dashboard/progress/history stay
  visible; logging, Coach chat, plan generation, and check-ins redirect to
  `UpgradeScreen` (`gateOrRun()` in App.tsx).
- Days-left badge in the Today header during `trialing`. Soft upgrade
  banners at 7 days left (day 14) and 2 days left (day 19) —
  `TrialSoftPrompt.tsx`, dismissible per-session.
- Checkout: `POST /api/stripe/create-checkout-session` (plan: `monthly` $49
  or `annual` $399) → Stripe Checkout → `checkout.session.completed` webhook
  links `stripe_customer_id` via `client_reference_id` and sets `is_pro`.
  Requires `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` env vars
  (not yet in `.env` — add the real Stripe Price IDs before this goes live).

## ENVIRONMENT VARIABLES (.env)

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...             (installed, not yet used)
VITE_SUPABASE_URL=https://pdctqjrcsuldbgsijqpb.supabase.co
VITE_SUPABASE_ANON_KEY=...
STRIPE_PRICE_ID_MONTHLY=...    (needed for /api/stripe/create-checkout-session — not yet set)
STRIPE_PRICE_ID_ANNUAL=...     (needed for /api/stripe/create-checkout-session — not yet set)
```

Also present in `.env` but undocumented until now: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`ALLOWED_ORIGIN`. The service role key currently in `.env` looks like a
placeholder (too short to be a real Supabase service-role JWT) — server-side
admin operations (GDPR export/delete, the new trial/intake/metabolic routes)
will fail against it until it's replaced with the real key.

## CURRENT STATE

### Done ✅
- Auth (Supabase signup/login/session)
- MIND pillar complete: Phase Zero (7 sections) + Mind Gym daily check-in
- Deterministic mind responses (no API)
- Coaching Rules Engine (nutrition, training, adapt, scores)
- Design system: Black + White + Lime (#CAFF40) — v2 LOCKED
- AuthScreen; ProtectedRoute exists but is unused (App.tsx gates inline instead)
- TRAIN/FUEL plan generation wired (plan-generator.ts), daily check-in + adaptation loop, Stripe webhook (subscription created/deleted), GDPR export/delete, deployed to Vercel — all pre-existing, undocumented until this pass
- Adaptive TDEE learner (coaching-rules/adaptive-tdee.ts) blending onboarding prior with logged intake + trend weight
- Intake agent (photo/text food logging, personal food memory, confidence-gated auto-log) + metabolic agent (plain-language TDEE explainer) + orchestrator wiring them together — `POST /api/agents/intake(/confirm|/correct|/verify)`, `GET /api/agents/metabolic`
- Trial system: 21-day no-card trial, server-set `trial_ends_at`, read-only-on-expiry gating, days-left badge, day-14/day-19 soft prompts, Stripe Checkout CTA (`UpgradeScreen`)

### Not Done ❌
- RECOVER tab: build recovery tracking UI
- Performance scores display (calculateScores in scores.ts)
- A logging UI for the intake agent (API + agent logic exist; FUEL tab doesn't yet call `/api/agents/intake` from a photo/text input screen)
- Set real `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` — checkout route will 500 without them
- Replace the placeholder-looking `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Confirm `daily_checkins.weight_kg` is the actual column adaptive-tdee should read for trend weight (assumed — see adaptive-tdee.ts comment)

## WIRING PRIORITY (next sessions)

Steps 1–5 and 7–8 below were already done before this file caught up to
documenting them (see CURRENT STATE). What's actually next:

1. Build a photo/text logging UI in the FUEL tab that calls
   `POST /api/agents/intake` — the agent + API exist, there's no screen yet
2. RECOVER tab UI
3. Performance scores dashboard (calculateScores in scores.ts)
4. Set real Stripe Price IDs and confirm the `daily_checkins.weight_kg`
   assumption in adaptive-tdee.ts (see CURRENT STATE → Not Done)

## GIT WORKFLOW

PowerShell — run commands SEPARATELY (no &&):
```
git add .
git commit -m "message"
git push
```

## CRITICAL RULES

1. NO && in PowerShell — run git commands separately
2. Vite + React 19, NOT Next.js — no App Router, no server components
3. Two processes: npm run dev (3000) + node server.js (3001)
4. `/api/mind` is GONE — never add API calls for mind responses
5. Supabase: always `.maybeSingle()` not `.single()`, always `.upsert()` not `.insert()`
6. LIME (#CAFF40) is the ONLY brand accent color — no gold, no navy, no purple. Exception: the four sanctioned semantic state colors (green/orange/red/blue) may appear where they carry universal meaning (success/warning/error/sleep). They are not accent colors and must not be used decoratively.
   Semantic state colors (green/orange/red/blue) are functional exceptions to this rule, not brand accents — they exist only where they carry universal meaning (success/warning/error/sleep).
7. Black design system only — #000000 background, #0D0D0D cards
8. Card style: bg-[#0D0D0D] border border-[#262626] rounded-2xl
9. Every coaching engine output includes reasoning[] — always show it to the user
10. Coaching engine is pure TypeScript, zero API calls, zero external dependencies
11. Adaptive TDEE never overrides safety gating or macro floors — the learner (`src/lib/coaching-rules/adaptive-tdee.ts`) adjusts calories only, within engine bounds (protein floor, 25% fat floor, ~18% recovery/injury deficit cap). Existing refeed and mass-gain rules in the engine always take precedence over the adaptive delta.
12. The engine's `verifications[]` pattern means "never guess silently" — confidence-gated auto-log (intake-agent) is the one sanctioned exception. It only auto-writes to `food_logs` when `agent_memory.confirm_count >= 5 AND correction_variance < 0.10` for that meal pattern, and even then the entry is written `verified=false` until the user taps to confirm or 48h pass with no edit. Every other intake path stays unverified until explicit confirmation.

## COMMON ISSUES

- Port 3000 in use: kill with `npx kill-port 3000`
- server.js not running: start with `node server.js` in separate terminal
- Supabase 406 error: use `.maybeSingle()` not `.single()`
- Supabase 409 conflict: use `.upsert()` not `.insert()`
- Supabase timeout: project is EU West, should be fast from EU
- Vite path alias: @/* maps to project root (./)
