import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNutritionPlan } from '@/lib/agents/nutrition-agent'
import { verifyAndClampTargets } from '@/lib/coaching-rules/engine'
import type { OnboardingData, DailyCheckin } from '@/types'

const DEFAULT_ONBOARDING: Omit<OnboardingData, 'id' | 'user_id' | 'created_at'> = {
  goal: 'muscle_gain',
  training_experience: 'intermediate',
  training_location: 'gym',
  days_per_week: 4,
  weight_kg: 80,
  height_cm: 175,
  age: 25,
  gender: 'male',
  activity_level: 'moderately_active',
  allergies: [],
  food_preferences: [],
  fasting_preference: null,
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if ((profile?.subscription_tier ?? 'free') !== 'pro') {
      return NextResponse.json({
        error: 'upgrade_required',
        message: 'Upgrade to King Pro to generate personalized nutrition plans.',
      }, { status: 403 })
    }

    const { data: onboarding } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Use defaults if onboarding not completed yet
    const effectiveOnboarding = (onboarding ?? {
      id: '',
      user_id: user.id,
      ...DEFAULT_ONBOARDING,
    }) as OnboardingData

    const { data: recentCheckins } = await supabase
      .from('daily_checkins')
      .select('energy_level, soreness_level, mood, weight_kg, adherence_workout, adherence_nutrition')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    const { coachingDirectives, clampedMacros } = recentCheckins && recentCheckins.length > 0
      ? verifyAndClampTargets(effectiveOnboarding, recentCheckins as DailyCheckin[])
      : verifyAndClampTargets(effectiveOnboarding, [])

    await supabase.from('nutrition_plans').update({ is_active: false }).eq('user_id', user.id)

    const planData = await generateNutritionPlan(effectiveOnboarding, {
      directives: coachingDirectives,
      clampedMacros,
    })

    const { data: plan, error } = await supabase
      .from('nutrition_plans')
      .insert({ user_id: user.id, plan_data: planData, is_active: true })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Nutrition generation error:', error)
    return NextResponse.json({ error: 'Failed to generate nutrition plan' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: plan } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Nutrition fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch nutrition plan' }, { status: 500 })
  }
}
