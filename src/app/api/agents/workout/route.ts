import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWorkoutPlan } from '@/lib/agents/workout-agent'
import type { OnboardingData } from '@/types'

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
        message: 'Upgrade to King Pro to generate personalized workout plans.',
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

    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)

    const planData = await generateWorkoutPlan(effectiveOnboarding)

    const { data: plan, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        plan_data: planData,
        week_number: 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Workout generation error:', error)
    return NextResponse.json({ error: 'Failed to generate workout plan' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: plan } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Workout fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workout plan' }, { status: 500 })
  }
}
