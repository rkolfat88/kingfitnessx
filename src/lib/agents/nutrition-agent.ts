import { generateText } from 'ai'
import { aiModel } from '@/lib/openai'
import { buildNutritionPrompt } from './prompts'
import { calculateBMR, calculateTDEE } from '@/lib/utils'
import type { OnboardingData, NutritionPlanData } from '@/types'

export async function generateNutritionPlan(onboarding: OnboardingData): Promise<NutritionPlanData> {
  const bmr = calculateBMR(onboarding.weight_kg, onboarding.height_cm, onboarding.age, onboarding.gender)
  const tdee = calculateTDEE(bmr, onboarding.activity_level)

  const prompt = buildNutritionPrompt(onboarding, tdee)

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
