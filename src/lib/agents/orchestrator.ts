import { generateText } from 'ai'
import { aiModel } from '@/lib/openai'
import { classifyIntentPrompt } from './prompts'
import type { AgentType } from '@/types'

export async function classifyIntent(message: string): Promise<AgentType> {
  try {
    const { text } = await generateText({
      model: aiModel,
      maxOutputTokens: 10,
      prompt: classifyIntentPrompt(message),
      temperature: 0,
    })

    const classification = text.trim().toLowerCase()
    const validTypes: AgentType[] = ['workout', 'nutrition', 'recovery', 'accountability', 'analysis', 'general']

    if (validTypes.includes(classification as AgentType)) {
      return classification as AgentType
    }
    return 'general'
  } catch {
    return 'general'
  }
}
