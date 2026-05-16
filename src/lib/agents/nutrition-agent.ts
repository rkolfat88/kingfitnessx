import { generateText } from 'ai'
import { aiModel } from '@/lib/openai'
import { buildNutritionPrompt } from './prompts'
import { calculateBMR, calculateTDEE } from '@/lib/utils'
import type { OnboardingData, NutritionPlanData } from '@/types'
import type { ClampedMacros } from '@/lib/coaching-rules/engine'

export async function generateNutritionPlan(
  onboarding: OnboardingData,
  options?: { directives?: string[]; clampedMacros?: ClampedMacros }
): Promise<NutritionPlanData> {
  const bmr = calculateBMR(onboarding.weight_kg, onboarding.height_cm, onboarding.age, onboarding.gender)
  const baseTdee = calculateTDEE(bmr, onboarding.activity_level)
  const tdee = options?.clampedMacros?.daily_calories ?? baseTdee

  const prompt = buildNutritionPrompt(onboarding, tdee, options?.directives)

  const { text } = await generateText({
    model: aiModel,
    maxOutputTokens: 3000,
    prompt,
    temperature: 0.7,
  })

  if (!text) throw new Error('No nutrition plan generated')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in nutrition response')

  return JSON.parse(jsonMatch[0]) as NutritionPlanData
}
