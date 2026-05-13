import { createOpenAI } from '@ai-sdk/openai'

export const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const AI_MODEL = 'gpt-4o'
export const aiModel = openaiProvider(AI_MODEL)
