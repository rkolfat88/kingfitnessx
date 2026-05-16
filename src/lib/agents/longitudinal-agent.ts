import type { SupabaseClient } from '@supabase/supabase-js'
import type { DailyCheckin } from '@/types'

export interface PerformanceScores {
  recovery_score: number
  adherence_score: number
  momentum_score: number
  stress_load: number
  discipline_rating: number
  fat_loss_velocity: number
  readiness_score: number
  training_readiness: number
  recovery_risk: number
}

export interface IntelligenceAlert {
  alert_type: string
  severity: 'info' | 'warning' | 'critical' | 'positive'
  title: string
  message: string
  action_suggestion: string
}

/**
 * Calculates performance scores from check-in data
 */
export function calculatePerformanceScores(
  checkins: DailyCheckin[],
  startWeight: number | null
): PerformanceScores {
  if (checkins.length === 0) {
    return {
      recovery_score: 50,
      adherence_score: 0,
      momentum_score: 50,
      stress_load: 50,
      discipline_rating: 0,
      fat_loss_velocity: 0,
      readiness_score: 50,
      training_readiness: 50,
      recovery_risk: 50,
    }
  }

  const recent = checkins.slice(0, 7)

  // Recovery score (inverse of soreness, boosted by energy)
  const avgSoreness = recent.reduce((s, c) => s + (c.soreness_level || 5), 0) / recent.length
  const avgEnergy = recent.reduce((s, c) => s + (c.energy_level || 5), 0) / recent.length
  const recovery_score = Math.round(((10 - avgSoreness) * 5 + avgEnergy * 5) / 2)

  // Adherence score
  const workoutAdherence = recent.filter(c => c.adherence_workout).length / recent.length
  const nutritionAdherence = recent.filter(c => c.adherence_nutrition).length / recent.length
  const adherence_score = Math.round((workoutAdherence * 0.6 + nutritionAdherence * 0.4) * 100)

  // Stress load (inverse of mood + soreness)
  const avgMood = recent.reduce((s, c) => s + (c.mood || 5), 0) / recent.length
  const stress_load = Math.round(((10 - avgMood) * 5 + avgSoreness * 5) / 2)

  // Discipline rating (streak * adherence)
  const streak = checkins.length
  const discipline_rating = Math.min(100, Math.round(adherence_score * 0.7 + Math.min(streak * 3, 30)))

  // Fat loss velocity (weight change per week)
  const weights = checkins.filter(c => c.weight_kg).map(c => c.weight_kg!)
  let fat_loss_velocity = 0
  if (weights.length >= 2 && startWeight) {
    const weeklyChange = (weights[0] - weights[weights.length - 1]) / (weights.length / 7)
    fat_loss_velocity = Math.round(weeklyChange * 100) / 100
  }

  // Momentum score
  const momentum_score = Math.round(
    adherence_score * 0.4 +
    recovery_score * 0.3 +
    (100 - stress_load) * 0.3
  )

  // Overall readiness
  const readiness_score = Math.round(
    recovery_score * 0.4 +
    (100 - stress_load) * 0.3 +
    adherence_score * 0.3
  )

  // Training Readiness
  const training_readiness = Math.round(
    avgEnergy * 6 +
    (workoutAdherence * 100) * 0.2 +
    recovery_score * 0.2
  )

  // Recovery Risk (high = dangerous)
  const highSorenessDays = recent.filter(c => (c.soreness_level || 0) >= 7).length
  const recovery_risk = Math.round(
    (highSorenessDays / recent.length) * 60 +
    (avgSoreness / 10) * 40
  )

  return {
    recovery_score:    Math.min(100, Math.max(0, recovery_score)),
    adherence_score:   Math.min(100, Math.max(0, adherence_score)),
    momentum_score:    Math.min(100, Math.max(0, momentum_score)),
    stress_load:       Math.min(100, Math.max(0, stress_load)),
    discipline_rating: Math.min(100, Math.max(0, discipline_rating)),
    fat_loss_velocity,
    readiness_score:   Math.min(100, Math.max(0, readiness_score)),
    training_readiness: Math.min(100, Math.max(0, training_readiness)),
    recovery_risk:     Math.min(100, Math.max(0, recovery_risk)),
  }
}

/**
 * Detects patterns and generates intelligence alerts
 */
export function detectPatterns(
  checkins: DailyCheckin[],
  scores: PerformanceScores,
  goal: string
): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = []
  const recent7 = checkins.slice(0, 7)
  const recent3 = checkins.slice(0, 3)

  if (checkins.length < 3) return alerts

  // Plateau detection (weight stalled for 5+ days)
  const weights = checkins.filter(c => c.weight_kg).map(c => c.weight_kg!)
  if (weights.length >= 5) {
    const recentWeights = weights.slice(0, 5)
    const weightVariance = Math.max(...recentWeights) - Math.min(...recentWeights)
    if (weightVariance < 0.5 && goal === 'fat_loss') {
      alerts.push({
        alert_type: 'plateau_detected',
        severity: 'warning',
        title: 'Fat Loss Plateau Detected',
        message: 'Your weight has not changed significantly in the last 5 days.',
        action_suggestion: 'Consider a 2-day refeed, increase daily steps, or recalculate calories.',
      })
    }
  }

  // Overtraining risk
  if (scores.recovery_score < 40 && recent3.every(c => (c.soreness_level || 0) >= 7)) {
    alerts.push({
      alert_type: 'overtraining_risk',
      severity: 'critical',
      title: 'Overtraining Risk Detected',
      message: 'High soreness for 3+ consecutive days with low recovery score.',
      action_suggestion: 'Take 1-2 rest days immediately. Prioritize sleep and nutrition.',
    })
  }

  // Burnout risk
  const lowMoodDays = recent7.filter(c => (c.mood || 5) <= 4).length
  const lowAdherenceDays = recent7.filter(c => !c.adherence_workout).length
  if (lowMoodDays >= 3 && lowAdherenceDays >= 3) {
    alerts.push({
      alert_type: 'burnout_risk',
      severity: 'warning',
      title: 'Burnout Risk Detected',
      message: 'Low mood and missed workouts detected over the past week.',
      action_suggestion: 'Reduce training intensity for 5 days. Focus on enjoyable movement.',
    })
  }

  // Low adherence trend
  if (scores.adherence_score < 40 && checkins.length >= 5) {
    alerts.push({
      alert_type: 'low_adherence_trend',
      severity: 'warning',
      title: 'Adherence Dropping',
      message: 'Workout compliance has been below 40% this week.',
      action_suggestion: 'Simplify your plan. Commit to minimum viable workouts (20 min).',
    })
  }

  // Recovery debt
  if (scores.recovery_score < 35) {
    alerts.push({
      alert_type: 'recovery_debt',
      severity: 'critical',
      title: 'Recovery Debt Accumulating',
      message: 'Your body is not recovering adequately between sessions.',
      action_suggestion: 'Prioritize 8+ hours sleep, reduce training volume by 50% this week.',
    })
  }

  // Positive: streak milestone
  if (scores.discipline_rating >= 80 && checkins.length >= 7) {
    alerts.push({
      alert_type: 'streak_milestone',
      severity: 'positive',
      title: `${checkins.length}-Day Streak! 🔥`,
      message: 'Outstanding consistency. You are in the top tier of transformations.',
      action_suggestion: 'Keep this momentum. Consider increasing training intensity.',
    })
  }

  // Positive: momentum building
  if (scores.momentum_score >= 75) {
    alerts.push({
      alert_type: 'momentum_building',
      severity: 'positive',
      title: 'Momentum Building',
      message: 'Your energy, adherence, and recovery are all trending positively.',
      action_suggestion: 'This is the optimal time to push harder. Add progressive overload.',
    })
  }

  // Fat loss on track
  if (goal === 'fat_loss' && scores.fat_loss_velocity < -0.3 && scores.fat_loss_velocity > -1.5) {
    alerts.push({
      alert_type: 'goal_on_track',
      severity: 'positive',
      title: 'Fat Loss On Track',
      message: `Losing ${Math.abs(scores.fat_loss_velocity)}kg per week — optimal rate.`,
      action_suggestion: 'Maintain current deficit. Ensure protein stays high.',
    })
  }

  return alerts
}

/**
 * Saves performance scores and alerts to database
 */
export async function saveIntelligenceData(
  supabase: SupabaseClient,
  userId: string,
  scores: PerformanceScores,
  alerts: IntelligenceAlert[]
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  // Save scores
  await supabase.from('performance_scores').upsert({
    user_id: userId,
    score_date: today,
    ...scores,
  }, { onConflict: 'user_id,score_date' })

  // Save new alerts (avoid duplicates from today)
  if (alerts.length > 0) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: existingAlerts } = await supabase
      .from('intelligence_alerts')
      .select('alert_type')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())

    const existingTypes = new Set(existingAlerts?.map((a: { alert_type: string }) => a.alert_type) ?? [])
    const newAlerts = alerts.filter(a => !existingTypes.has(a.alert_type))

    if (newAlerts.length > 0) {
      await supabase.from('intelligence_alerts').insert(
        newAlerts.map(a => ({ user_id: userId, ...a }))
      )
    }
  }
}
