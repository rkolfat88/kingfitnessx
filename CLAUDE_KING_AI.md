# CLAUDE.md — King AI Coach
# ============================================
# Auto-read by Claude Code every session.
# Project root: C:\king_ai_app
# ============================================

## PROJECT

King AI Coach — Premium mobile-first AI fitness coaching app.
Google AI Studio export → upgraded to standalone production app.

## ARCHITECTURE

```
Vite 3000 (React frontend) ←→ Express 3001 (Node backend) ←→ OpenAI API
                                                          ←→ Supabase (to wire)
```

Two processes to run:
```
Terminal 1: npm run dev        (Vite on port 3000)
Terminal 2: node server.js     (Express on port 3001)
```

## STACK

- Vite 6 + React 19 + TypeScript
- Tailwind v4 (@tailwindcss/vite plugin, NO tailwind.config)
- Lucide React icons
- Motion (animation)
- Express + dotenv (backend server.js)
- @google/genai (Gemini SDK — installed but not yet used)
- OpenAI API (gpt-4o-mini — already wired in server.js)
- Supabase (NOT yet wired — next priority)
- Stripe (NOT yet wired)

## FILE STRUCTURE

```
C:\king_ai_app\
├── src\
│   ├── main.tsx
│   ├── App.tsx
│   ├── mockData.ts          ← ALL data is currently mock
│   ├── index.css
│   └── components\          ← 10 screen components
├── server.js                ← Express API (port 3001)
├── index.html               ← title needs updating
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env                     ← OPENAI_API_KEY goes here
```

## 10 SCREENS

1. Dashboard — AI readiness, metrics, quick actions
2. Form Analysis — exercise form checker (camera)
3. Coach Chat — AI coaching (wired to server.js /api/chat)
4. Onboarding — user profile wizard
5. Timeline — activity feed
6. Active Workout — live workout tracker
7. Nutrition — meal plans and macros
8. Progress — charts and analytics
9. Paywall — upgrade to Pro
10. Settings — profile and preferences

## BACKEND (server.js) — ALREADY WIRED

```
POST /api/chat   — Coach King AI (gpt-4o-mini)
GET  /api/health — health check
```

### Coach King System Prompt Rules (DO NOT CHANGE)
- Protein: 2.2g × lean body mass kg
- Mass gain: +10% calories if weight gain < 0.25%/week
- Fat loss: refeed if weight drops > 1.5%/week
- CNS deficit: -30% volume if fatigue ≥8 AND sleep <80%
- Joint pain ≥7: flag exercise substitutions
- HRV < 60ms: cap RPE at 7, no PRs
- Readiness < 70%: reduce intensity
- Readiness ≥ 90%: green light for max effort

## DESIGN SYSTEM — NEVER BREAK

### Colors (hex values only, NOT CSS variables in components)
```
Background:     #080808
Cards:          #1A1A1A
Card border:    border border-[#C9A84C]/15 rounded-2xl
Gold base:      #C9A84C  (ONLY accent — no blue, no purple)
Gold light:     #E8C76A
Gold dark:      #9B7A2E
Text primary:   #F0F0F0
Text secondary: #909090
Text muted:     #505050
Green:          #22C55E
Orange:         #F97316
Red:            #EF4444
```

### Tailwind v4 Custom Tokens
```
gold-base, gold-light, gold-dark
```

### Fonts
```
Sans:    Plus Jakarta Sans
Display: Space Grotesk
Mono:    JetBrains Mono
```

### Card Style
```
bg-[#1a1a1a] border border-[#C9A84C]/15 rounded-2xl
```

### Layout
```
Mobile-first: max-w-[430px] centered
Sticky wordmark header
Fixed bottom navigation
No sidebar
```

### Spacing
```
Cards gap:      mb-6 minimum
Section gap:    32px dividers
Page padding:   px-5
Card padding:   p-5
```

### Typography
```
Page title:     text-4xl font-black text-white (Space Grotesk)
Section header: text-base font-bold uppercase tracking-widest text-[#C9A84C] mb-4
Card title:     text-base font-semibold text-white
Body:           text-sm text-[#909090]
Muted:          text-xs text-[#505050]
Mono data:      font-mono (JetBrains Mono)
```

## ENVIRONMENT VARIABLES (.env)

```
OPENAI_API_KEY=sk-...          (already used by server.js)
GEMINI_API_KEY=...             (for @google/genai if switching)
VITE_SUPABASE_URL=https://xvpmqdsllqtrhsyqhikh.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## SUPABASE (TO WIRE)

Project ID: xvpmqdsllqtrhsyqhikh
Region: EU West (Ireland)
URL: https://xvpmqdsllqtrhsyqhikh.supabase.co

Tables already exist from previous app:
user_profiles, onboarding_data, workout_plans, nutrition_plans,
daily_checkins, conversation_history, agent_memory, knowledge_base,
performance_scores, intelligence_alerts, subscriptions

## CURRENT STATE

### Done ✅
- 10 screens built (UI complete)
- Coach King AI chat wired (server.js → OpenAI gpt-4o-mini)
- Deterministic coaching rules in system prompt
- Biometric context injection in chat
- Design system applied
- Animations (animate-fade-in, animate-bounce-short, no-scrollbar)
- FormAnalysis SVG bug fixed
- Layout: max-w-[430px], sticky header, fixed bottom nav

### Not Done ❌
- Supabase auth (signup/login/sessions)
- Real user data (all mock from mockData.ts)
- Replace mockData.ts with Supabase queries
- Stripe payments
- Deployed to Vercel/production
- index.html title still "My Google AI Studio App" → fix to "King AI Coach"

## WIRING PRIORITY

1. Fix index.html title
2. Install @supabase/supabase-js
3. Add auth (signup, login, session management)
4. Replace mockData.ts with Supabase queries screen by screen
5. Add Stripe payments
6. Deploy to Vercel

## GIT WORKFLOW

PowerShell — run commands SEPARATELY (no &&):
```
git add .
git commit -m "message"
git push
```

## CRITICAL RULES

1. NO && in PowerShell — run commands separately
2. This is Vite + React 19, NOT Next.js — no App Router, no server components
3. Two processes: npm run dev (3000) + node server.js (3001)
4. API calls go to localhost:3001/api/* (Express backend)
5. Supabase client uses VITE_ prefixed env vars for Vite
6. Gold is the ONLY accent color
7. Card style: bg-[#1a1a1a] border border-[#C9A84C]/15 rounded-2xl
8. Fonts: Plus Jakarta Sans, Space Grotesk, JetBrains Mono
9. All data in mockData.ts — replace with Supabase one screen at a time
10. @google/genai is installed but not yet used

## COMMON ISSUES

- Port 3000 in use: kill with `npx kill-port 3000`
- server.js not running: start with `node server.js` in separate terminal
- Supabase timeout: project is EU West, should be fast from EU
- Vite path alias: @/* maps to project root (./)
