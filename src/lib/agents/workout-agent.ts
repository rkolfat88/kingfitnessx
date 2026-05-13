import { generateText } from 'ai'
import { aiModel } from '@/lib/openai'
import { buildWorkoutPrompt } from './prompts'
import type { OnboardingData, WorkoutPlanData } from '@/types'

export async function generateWorkoutPlan(onboarding: OnboardingData): Promise<WorkoutPlanData> {
  const prompt = buildWorkoutPrompt(onboarding)

  const { text } = await generateText({
    model: aiModel,
    maxOutputTokens: 3000,
    prompt,
    temperature: 0.7,
  })

  if (!text) throw new Error('No workout plan generated')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in workout response')

  return JSON.parse(jsonMatch[0]) as WorkoutPlanData
}
