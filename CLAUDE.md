# CLAUDE.md — King AI Coach Project Context
# =============================================
# Claude Code reads this file automatically every session.
# Never repeat project context again. Save tokens.
# =============================================

## PROJECT

King AI Coach — AI-powered fitness transformation platform.
Live: https://king-ai-app.vercel.app
Repo: https://github.com/khtbt91-ctrl/king-ai-app

## STACK

- Next.js 16 (App Router, TypeScript, Turbopack)
- TailwindCSS v4 (CSS variables, NOT tailwind.config for colors)
- Supabase (PostgreSQL, Auth, Storage) — project: xvpmqdsllqtrhsyqhikh (EU West)
- OpenAI API (GPT-4o for specialists, GPT-4o-mini for routing/safety)
- Stripe (test mode)
- Vercel (auto-deploys from GitHub main branch)
- PowerShell terminal (NOT bash — use semicolons not &&)

## FILE STRUCTURE

```
C:\king-ai-coach\src\
├── app\
│   ├── (auth)\login, signup
│   ├── (dashboard)\home, chat, workout, nutrition, check-in, progress, settings, upgrade, scores, onboarding
│   ├── api\chat, agents\workout, agents\nutrition, agents\orchestrator, check-in, intelligence, stripe\
│   ├── globals.css
│   └── page.tsx (landing)
├── components\
│   ├── ui\ (button, input, card, badge, skeleton, score-ring, stat-card)
│   ├── dashboard\ (bottom-nav, agent-card, ai-feed-item)
│   ├── chat\ (chat-interface, message-bubble, chat-input, nutrition-card, workout-card, score-card, directive-card)
│   └── onboarding\ (onboarding-form)
├── lib\
│   ├── supabase\ (client, server, middleware)
│   ├── agents\ (orchestrator, memory-agent, search-agent, safety-agent, specialist-agents, workout-agent, nutrition-agent, nutritionist-agent, supplement-agent, holistic-agent, longitudinal-agent, prompts)
│   ├── coaching-rules\ (engine.ts — deterministic math rules)
│   ├── openai.ts, stripe.ts, feature-gate.ts, utils.ts
├── types\index.ts
└── proxy.ts (Next.js 16 middleware replacement)
```

## DESIGN SYSTEM — ABSOLUTE RULES

### Colors (use hex values directly, NOT CSS variables in components)
```
Background:     #080808
Surface:        #1a1a1a  (all cards)
Border:         use border-2 border-[#C9A84C]/20 for cards
Gold:           #C9A84C  (ONLY accent color — no purple, no blue accents)
Gold light:     #E8C76A
Text primary:   #F0F0F0
Text secondary: #909090
Text muted:     #505050
Green:          #22C55E
Orange:         #F97316
Red:            #EF4444
```

### Card Style (use everywhere)
```
bg-[#1a1a1a] border-2 border-[#C9A84C]/20 rounded-2xl p-5 mb-6
```

### Typography
```
Page title:     text-4xl font-black text-white
Page subtitle:  text-sm font-semibold uppercase tracking-widest text-[#505050]
Section header: text-base font-bold uppercase tracking-widest text-[#C9A84C] mb-4
Card title:     text-base font-semibold text-white
Body text:      text-sm text-[#909090]
Muted text:     text-xs text-[#505050]
```

### Spacing
```
Cards gap:      mb-6 (minimum 24px between cards)
Section gap:    <div style={{height:'32px'}} /> between sections
Page padding:   px-5 pt-14 pb-32
Card padding:   p-5
```

### Navigation
Bottom nav only. No sidebar. No top nav inside dashboard.
5 items: Home, Training, Nutrition, Progress, Coach

## AI AGENT PIPELINE

```
User message → Memory Agent → Orchestrator → Search Agent → Coaching Rules Engine → Specialist Agent → Safety Agent → Response
```

8 specialist agents: workout, nutrition, nutritionist, carnivore, recovery, accountability, supplement, holistic, analysis

GPT-4o-mini: routing, safety, memory extraction
GPT-4o: specialist responses, plan generation

## DETERMINISTIC RULES ENGINE (src/lib/coaching-rules/engine.ts)

- Protein locked at 2.2g × lean mass kg
- Mass gain: +10% calories if weight gain < 0.25%/week
- Fat loss: refeed if weight drops > 1.5%/week
- CNS deficit: -30% volume if fatigue ≥8 AND sleep <80%
- Joint pain ≥7: flag exercise substitutions

## DATABASE TABLES

user_profiles, onboarding_data, workout_plans, nutrition_plans, daily_checkins, conversation_history, agent_memory, agent_logs, knowledge_base, performance_scores, intelligence_alerts, subscriptions, supplement_sources, holistic_insights

All have RLS enabled.

## SUBSCRIPTION TIERS

Free: 3 messages/day, view plans only
Pro ($19/mo): unlimited everything

## GIT WORKFLOW

PowerShell commands (run separately, NOT with &&):
```
git add .
git commit -m "message"
git push
```
Vercel auto-deploys from main branch in ~2 minutes.

## CRITICAL RULES

1. NEVER use && in PowerShell — run commands separately
2. NEVER use bg-[#161616] for cards — use bg-[#1a1a1a] border-2 border-[#C9A84C]/20
3. NEVER remove Supabase auth, API calls, or agent logic when editing UI
4. ALWAYS run npm run build before committing
5. ALWAYS use hex color values, NOT CSS variable names in components
6. ALWAYS add mb-6 between cards, never mb-3 or mb-4
7. Section headers are text-base font-bold uppercase text-[#C9A84C], NOT text-xs
8. Page titles are text-4xl font-black, NOT text-2xl
9. All pages need px-5 padding, NOT px-4
10. Auth is currently BYPASSED for testing (proxy.ts BYPASS_AUTH = true)

## COMMON FIXES

If cards are invisible: border is too subtle. Use border-2 border-[#C9A84C]/20
If spacing is too tight: use mb-6 between cards, height 32px between sections
If content touches edge: add px-5 to main container
If save button overlaps: use bottom-20 not bottom-16
If deployment blocked: check git email matches GitHub account
If Supabase timeout: project is in wrong region or paused