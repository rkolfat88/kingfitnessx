import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/agents/prompts'
import { classifyIntent } from '@/lib/agents/orchestrator'
import { aiModel } from '@/lib/openai'
import { verifyAndClampTargets } from '@/lib/coaching-rules/engine'
import type { DailyCheckin } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Enforce daily message limit for free users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if ((profile?.subscription_tier ?? 'free') !== 'pro') {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('conversation_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', `${today}T00:00:00`)

      if ((count ?? 0) >= 3) {
        return new Response(JSON.stringify({
          error: 'limit_reached',
          message: 'You have used your 3 free messages today. Upgrade to King Pro for unlimited coaching.',
        }), { status: 429, headers: { 'Content-Type': 'application/json' } })
      }
    }

    const { messages } = await request.json() as { messages: UIMessage[] }
    const lastMessage = messages[messages.length - 1]
    const lastText = lastMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('') ?? ''

    const { data: onboarding } = await supabase
      .from('onboarding_data').select('*').eq('user_id', user.id).single()

    const agentType = await classifyIntent(lastText)

    // Fetch recent check-ins for prompt engineering context and coaching rules
    const { data: recentCheckins } = await supabase
      .from('daily_checkins')
      .select('energy_level, soreness_level, mood, weight_kg, adherence_workout, adherence_nutrition')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    // Engineer the prompt for maximum quality (silent — user never sees this)
    const { engineerPrompt } = await import('@/lib/agents/prompt-engineer')
    const engineeredMessage = await engineerPrompt(lastText, agentType, {
      onboarding,
      recentCheckins: recentCheckins ?? [],
    })

    await supabase.from('conversation_history').insert({
      user_id: user.id,
      role: 'user',
      content: lastText,
      agent_type: agentType,
    })

    let systemPrompt = buildSystemPrompt(onboarding)

    if (onboarding && recentCheckins && recentCheckins.length > 0) {
      const { coachingDirectives, clampedMacros } = verifyAndClampTargets(
        onboarding,
        recentCheckins as DailyCheckin[]
      )
      systemPrompt += '\n\nACTIVE COACHING DIRECTIVES:\n' + coachingDirectives.join('\n')
      systemPrompt += `\n\nVERIFIED MACRO TARGETS: ${clampedMacros.daily_calories} kcal | P: ${clampedMacros.protein_g}g | C: ${clampedMacros.carbs_g}g | F: ${clampedMacros.fat_g}g`
    }

    // Replace last user message with engineered version for AI, keep original for history
    const sliced = messages.slice(-10)
    if (engineeredMessage !== lastText && sliced.length > 0) {
      const lastIdx = sliced.length - 1
      sliced[lastIdx] = {
        ...sliced[lastIdx],
        parts: [{ type: 'text' as const, text: engineeredMessage }],
      }
    }
    const modelMessages = await convertToModelMessages(sliced)

    const result = streamText({
      model: aiModel,
      maxOutputTokens: 1000,
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        await supabase.from('conversation_history').insert({
          user_id: user.id,
          role: 'assistant',
          content: text,
          agent_type: agentType,
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
