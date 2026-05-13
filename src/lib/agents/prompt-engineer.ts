import { generateText } from 'ai'
import { openaiProvider } from '@/lib/openai'
import type { OnboardingData, AgentType } from '@/types'

// Use a fast, cheap model for prompt engineering
const miniModel = openaiProvider('gpt-4o-mini')

interface RecentCheckin {
  energy_level: number
  soreness_level: number
  mood: number
  weight_kg: number | null
}

interface UserContext {
  onboarding: OnboardingData | null
  recentCheckins: RecentCheckin[]
}

/**
 * The Prompt Engineer rewrites vague user messages into precise,
 * context-rich coaching prompts before they reach the specialist agents.
 * Users never see this — it happens transparently in the pipeline.
 */
export async function engineerPrompt(
  rawMessage: string,
  agentType: AgentType,
  context: UserContext
): Promise<string> {
  // Skip engineering for already detailed messages
  if (rawMessage.length > 200) return rawMessage

  const o = context.onboarding
  const userProfile = o
    ? `- Goal: ${o.goal} | Weight: ${o.weight_kg}kg | Age: ${o.age} | Gender: ${o.gender}
- Training: ${o.training_location}, ${o.days_per_week}x/week, ${o.training_experience}
- Activity: ${o.activity_level}`
    : 'No profile data'

  const latest = context.recentCheckins[0]
  const recentData = latest
    ? `- Energy: ${latest.energy_level}/10 | Soreness: ${latest.soreness_level}/10 | Mood: ${latest.mood}/10${latest.weight_kg ? ` | Weight: ${latest.weight_kg}kg` : ''}`
    : 'No recent check-in data'

  const agentRules: Record<AgentType, string> = {
    workout:        'Include training experience, equipment availability, and current recovery/soreness.',
    nutrition:      'Include current weight, goal, and any dietary preferences or restrictions.',
    recovery:       'Include soreness level, energy level, and recent training load.',
    accountability: 'Include recent adherence patterns and motivation context.',
    analysis:       'Include trend data, recent check-ins, and progress context.',
    general:        'Include overall goal and most relevant recent metrics.',
  }

  const engineeringPrompt = `You are an internal prompt engineering system for a fitness AI coach.
Your job: rewrite the user's vague message into a precise, context-rich coaching request.
The specialist agent (${agentType}) will receive your rewritten prompt — NOT the original.

USER PROFILE:
${userProfile}

RECENT DATA:
${recentData}

AGENT TYPE: ${agentType}
AGENT-SPECIFIC CONTEXT: ${agentRules[agentType] ?? agentRules.general}

ORIGINAL USER MESSAGE: "${rawMessage}"

REWRITING RULES:
1. Keep the user's original intent exactly — never change the topic
2. Add relevant context from their profile (weight, goal, experience)
3. Add relevant recent check-in data where applicable
4. Make it specific and actionable for a ${agentType} specialist
5. Keep the rewrite under 150 words
6. Do NOT add information the user didn't ask about

Return ONLY the rewritten prompt. No explanation. No preamble.`

  try {
    const { text } = await generateText({
      model: miniModel,
      maxOutputTokens: 200,
      temperature: 0.3,
      prompt: engineeringPrompt,
    })

    const engineered = text.trim()
    if (!engineered || engineered.length < 10) return rawMessage
    return engineered
  } catch {
    // Never break the main flow — fall back silently
    return rawMessage
  }
}
