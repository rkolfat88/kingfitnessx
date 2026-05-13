# King AI Coach — Project Context

## Stack
- Next.js 16 App Router + TypeScript
- TailwindCSS v4 with custom black/gold design system (CSS variables in globals.css)
- Supabase (auth, PostgreSQL, storage)
- AI SDK v6 (@ai-sdk/openai, @ai-sdk/react) with streamText/useChat

## Design System
- Background: #0A0A0A (--black), Surface: #111111/#1A1A1A/#222222 (--surface variants)
- Gold: #C9A84C (--gold), --gold-light: #E8C76A, --gold-dark: #9B7A2E
- All use CSS variables from globals.css — no hardcoded color values

## AI SDK Usage
- `streamText`/`generateText` from 'ai'; `aiModel` from '@/lib/openai'
- Chat streaming: `streamText(...)` then `result.toDataStreamResponse()`
- Frontend: `useChat` from '@ai-sdk/react' pointing to '/api/chat'

## Running locally
1. Fill in .env.local with your keys
2. Run: supabase db push
3. npm run dev
