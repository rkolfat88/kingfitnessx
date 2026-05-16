import type { OnboardingData, DailyCheckin } from '@/types'
import { calculateBMR, calculateTDEE } from '@/lib/utils'

export interface ClampedMacros {
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface CoachingRulesResult {
  coachingDirectives: string[]
  clampedMacros: ClampedMacros
}

const MIN_CALORIES: Record<string, number> = {
  male: 1500,
  female: 1200,
  other: 1350,
}

export function verifyAndClampTargets(
  profile: OnboardingData,
  recentCheckins: DailyCheckin[]
): CoachingRulesResult {
  const directives: string[] = []

  // Base calorie calculation
  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.gender)
  const tdee = calculateTDEE(bmr, profile.activity_level)

  let targetCalories: number
  if (profile.goal === 'fat_loss') {
    targetCalories = tdee - 400
  } else if (profile.goal === 'muscle_gain') {
    targetCalories = tdee + 250
  } else {
    targetCalories = tdee
  }

  // Clamp to safe floor and max deficit/surplus
  const minCals = MIN_CALORIES[profile.gender] ?? 1350
  targetCalories = Math.max(targetCalories, minCals)
  targetCalories = Math.max(targetCalories, tdee - 600)
  targetCalories = Math.min(targetCalories, tdee + 400)

  // Protein: higher multiplier for cutting
  const proteinMultiplier = profile.goal === 'fat_loss' ? 2.2
    : profile.goal === 'muscle_gain' ? 2.0
    : 1.8
  const protein_g = Math.round(profile.weight_kg * proteinMultiplier)

  // Fat minimum 0.8 g/kg, floor at 50 g
  const fat_g = Math.max(Math.round(profile.weight_kg * 0.8), 50)

  // Remaining calories as carbs
  const carbs_g = Math.max(0, Math.round((targetCalories - protein_g * 4 - fat_g * 9) / 4))

  const clampedMacros: ClampedMacros = {
    daily_calories: Math.round(targetCalories),
    protein_g,
    carbs_g,
    fat_g,
  }

  // Generate directives from recent check-in metrics
  if (recentCheckins.length > 0) {
    const recent = recentCheckins.slice(0, 7)
    const avgEnergy    = recent.reduce((s, c) => s + (c.energy_level    ?? 5), 0) / recent.length
    const avgSoreness  = recent.reduce((s, c) => s + (c.soreness_level  ?? 3), 0) / recent.length
    const avgMood      = recent.reduce((s, c) => s + (c.mood            ?? 5), 0) / recent.length
    const workoutAdh   = recent.filter(c => c.adherence_workout).length  / recent.length
    const nutritionAdh = recent.filter(c => c.adherence_nutrition).length / recent.length

    if (avgSoreness >= 7) {
      directives.push('REDUCE training intensity by 40% — athlete showing chronic high soreness (>7/10)')
    } else if (avgSoreness >= 5) {
      directives.push('Monitor recovery — consider scheduling a deload day this week')
    }

    if (avgEnergy < 4) {
      directives.push('INCREASE calorie intake by 100–150 kcal — persistent low energy detected')
    } else if (avgEnergy >= 8) {
      directives.push('Energy is optimal — athlete can handle increased training intensity')
    }

    if (avgMood < 4) {
      directives.push('Stress/mood flags detected — prioritize recovery and sleep over performance targets')
    }

    if (workoutAdh < 0.4) {
      directives.push('SIMPLIFY workout plan — adherence below 40%, reduce session complexity')
    } else if (workoutAdh >= 0.9) {
      directives.push('Excellent workout adherence — apply progressive overload this week')
    }

    if (nutritionAdh < 0.4) {
      directives.push('Simplify meal plan — nutrition adherence below 40%')
    }

    if (avgEnergy >= 7 && workoutAdh >= 0.8 && avgSoreness <= 4) {
      directives.push('Athlete in prime adaptation window — optimal time for progressive overload')
    }
  }

  if (directives.length === 0) {
    directives.push('Athlete metrics within normal range — maintain current programming')
  }

  return { coachingDirectives: directives, clampedMacros }
}
