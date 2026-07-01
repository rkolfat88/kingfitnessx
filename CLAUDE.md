# CLAUDE.md — King AI Coach
# ============================================
# Auto-read by Claude Code every session.
# Project root: C:\king_ai_app
# ============================================

## PROJECT

King AI Coach — Premium mobile-first AI fitness coaching app.
Four pillars: MIND · TRAIN · FUEL · RECOVER (+ Coach chat).

## ARCHITECTURE

```
Vite 3000 (React frontend) ←→ Express 3001 (Node backend) ←→ Anthropic API
                                                          ←→ Supabase (auth + data)
```

Two processes to run:
```
Terminal 1: npm run dev        (Vite on port 3000)
Terminal 2: node server.js     (Express on port 3001)
```

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
  - `nutrition.ts` — Mifflin-St Jeor BMR → TDEE → goal adjustment → macro split
  - `training.ts` — split selection, exercise library, injury substitutions
  - `adapt.ts` — daily session adaptation based on morning check-in state
  - `scores.ts` — recovery, readiness, adherence, momentum, discipline, mind scores
  - `index.ts` — single export point

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
│   │   ├── Paywall.tsx
│   │   ├── Settings.tsx
│   │   ├── FormAnalysis.tsx
│   │   ├── AuthScreen.tsx
│   │   └── ProtectedRoute.tsx
│   ├── screens\
│   │   └── MindScreen.tsx          ← routes to PhaseZero or MindGym
│   ├── contexts\
│   │   └── AuthContext.tsx
│   └── lib\
│       ├── supabase.ts
│       └── coaching-engine\        ← deterministic rules engine
│           ├── types.ts
│           ├── nutrition.ts
│           ├── training.ts
│           ├── adapt.ts
│           ├── scores.ts
│           ├── index.ts
│           └── test.ts
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

| Table | Purpose |
|---|---|
| `user_profiles` | Basic user info, onboarding_completed flag |
| `mind_profiles` | Phase Zero state, identity_statement, phase_zero_completed, mind_score |
| `phase_zero_progress` | Per-section responses and completion (user_id + day_number unique) |
| `mind_checkins` | Daily motivation check-ins + ai_response (user_id + checkin_date unique) |

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

## DESIGN SYSTEM — NEVER BREAK

> **Design system is Dark Navy + Gold. The old pure-black (#080808) system is DEPRECATED. All screens must use the navy palette.**

### Colors

```
Background:       #070B14   (was #080808 — DEPRECATED)
Surface 1:        #0D1117
Cards:            #111827
Surface elevated: #1A2236
Border default:   #1E2D40
Gold base:        #C9A84C   (ONLY accent — no blue, no purple)
Gold light:       #E8C76A
Gold dark:        #9B7A2E
Text primary:     #F0F4FF   (slight blue tint — was #F0F0F0)
Text secondary:   #8899BB
Text muted:       #445577
Green:            #22C55E
Orange:           #F97316
Red:              #EF4444
```

### Card Style

```
bg-[#111827] border border-[#C9A84C]/20 rounded-2xl
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
Page title:     text-4xl font-black text-[#F0F4FF] (Space Grotesk)
Section header: text-xs font-semibold uppercase tracking-widest text-[#C9A84C]
Card title:     text-base font-semibold text-[#F0F4FF]
Body:           text-sm text-[#8899BB]
Muted:          text-xs text-[#445577]
Mono data:      font-mono (JetBrains Mono)
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

## ENVIRONMENT VARIABLES (.env)

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...             (installed, not yet used)
VITE_SUPABASE_URL=https://pdctqjrcsuldbgsijqpb.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## CURRENT STATE

### Done ✅
- Auth (Supabase signup/login/session)
- MIND pillar complete: Phase Zero (7 sections) + Mind Gym daily check-in
- Deterministic mind responses (no API)
- Coaching Rules Engine (nutrition, training, adapt, scores)
- Design system: Dark Navy + Gold
- ProtectedRoute, AuthScreen
- Supabase tables: user_profiles, mind_profiles, phase_zero_progress, mind_checkins
- Fixed bottom nav (z-40), CTA buttons z-50

### Not Done ❌
- TRAIN tab: wire coaching engine → generate + save + display training plans
- FUEL tab: wire coaching engine → generate + save + display nutrition plans
- RECOVER tab: build recovery tracking UI
- Daily adaptation loop (adaptSession in adapt.ts → modify today's workout)
- Performance scores display (calculateScores in scores.ts)
- Read real ClientProfile from Supabase to feed the engine
- Stripe payments
- Deploy to Vercel

## WIRING PRIORITY (next sessions)

1. Read ClientProfile from Supabase (onboarding_data or user_profiles)
2. Run coaching engine → generate TrainingPlan + MacroTargets
3. Save generated plans to Supabase (workout_plans, nutrition_plans tables)
4. Display in TRAIN and FUEL tabs with reasoning[] shown to user
5. Daily adaptation: morning check-in → adaptSession → show modified workout
6. Performance scores dashboard
7. Stripe
8. Deploy

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
6. Gold is the ONLY accent color
7. Navy design system only — #070B14 background, #111827 cards
8. Card style: bg-[#111827] border border-[#C9A84C]/20 rounded-2xl
9. Every coaching engine output includes reasoning[] — always show it to the user
10. Coaching engine is pure TypeScript, zero API calls, zero external dependencies

## COMMON ISSUES

- Port 3000 in use: kill with `npx kill-port 3000`
- server.js not running: start with `node server.js` in separate terminal
- Supabase 406 error: use `.maybeSingle()` not `.single()`
- Supabase 409 conflict: use `.upsert()` not `.insert()`
- Supabase timeout: project is EU West, should be fast from EU
- Vite path alias: @/* maps to project root (./)
