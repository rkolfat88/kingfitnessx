'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Goal, ActivityLevel, TrainingLocation, TrainingExperience } from '@/types'

interface OnboardingFormData {
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  goal: Goal
  activity_level: ActivityLevel
  training_location: TrainingLocation
  training_experience: TrainingExperience
  days_per_week: number
  allergies: string[]
  food_preferences: string[]
  fasting_preference: string
}

const TOTAL_STEPS = 5

const goalOptions: { value: Goal; label: string; desc: string }[] = [
  { value: 'fat_loss', label: 'Fat Loss', desc: 'Burn fat, get lean & defined' },
  { value: 'muscle_gain', label: 'Muscle Gain', desc: 'Build size and strength' },
  { value: 'recomp', label: 'Recomposition', desc: 'Build muscle while losing fat' },
  { value: 'maintenance', label: 'Maintenance', desc: 'Stay fit, maintain current physique' },
]

const allergyOptions = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Fish', 'Shellfish']
const foodPrefOptions = ['High Protein', 'Low Carb', 'Vegetarian', 'Vegan', 'Mediterranean', 'Meal Prep Friendly']

export function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingFormData>({
    defaultValues: {
      goal: 'fat_loss',
      activity_level: 'moderately_active',
      training_location: 'gym',
      training_experience: 'intermediate',
      days_per_week: 4,
      gender: 'male',
      fasting_preference: 'none',
    }
  })

  const watchGoal = watch('goal')
  const watchLocation = watch('training_location')
  const watchExperience = watch('training_experience')
  const watchActivity = watch('activity_level')
  const watchGender = watch('gender')
  const watchFasting = watch('fasting_preference')

  function toggleAllergy(a: string) {
    setSelectedAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function togglePref(p: string) {
    setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function onSubmit(data: OnboardingFormData) {
    setLoading(true)
    try {
      const { error: onboardingError } = await supabase.from('onboarding_data').upsert({
        user_id: userId,
        age: Number(data.age),
        gender: data.gender,
        height_cm: Number(data.height_cm),
        weight_kg: Number(data.weight_kg),
        goal: data.goal,
        activity_level: data.activity_level,
        training_location: data.training_location,
        training_experience: data.training_experience,
        days_per_week: Number(data.days_per_week),
        allergies: selectedAllergies,
        food_preferences: selectedPrefs,
        fasting_preference: data.fasting_preference === 'none' ? null : data.fasting_preference,
      }, { onConflict: 'user_id' })

      if (onboardingError) throw onboardingError

      await supabase.from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)

      await Promise.allSettled([
        fetch('/api/agents/workout', { method: 'POST' }),
        fetch('/api/agents/nutrition', { method: 'POST' }),
      ])

      toast.success('Your personalized plan is ready!')
      router.push('/chat')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-3">
            <span className="text-xl">👑</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Build Your Plan</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--surface-3)] rounded-full mb-8">
          <div
            className="h-1 bg-[var(--gold)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue('gender', g)}
                        className={cn(
                          'py-2.5 rounded-lg text-sm font-medium border transition-all capitalize',
                          watchGender === g
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400 hover:border-gray-600'
                        )}
                      >{g}</button>
                    ))}
                  </div>
                </div>
                <Input
                  label="Age"
                  type="number"
                  placeholder="25"
                  {...register('age', { required: true, min: 16, max: 80 })}
                  error={errors.age ? 'Please enter a valid age (16-80)' : undefined}
                />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="gold" size="lg" className="flex-1" onClick={() => setStep(2)}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-xl font-semibold text-white mb-6">Body Metrics</h2>
                <Input
                  label="Height (cm)"
                  type="number"
                  placeholder="175"
                  {...register('height_cm', { required: true, min: 100, max: 250 })}
                  error={errors.height_cm ? 'Enter height in cm' : undefined}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  placeholder="80"
                  {...register('weight_kg', { required: true, min: 30, max: 300 })}
                  error={errors.weight_kg ? 'Enter weight in kg' : undefined}
                />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button type="button" variant="gold" size="lg" className="flex-1" onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-xl font-semibold text-white mb-6">Your Primary Goal</h2>
                <div className="space-y-3">
                  {goalOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('goal', opt.value)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border transition-all',
                        watchGoal === opt.value
                          ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40'
                          : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-gray-600'
                      )}
                    >
                      <p className={cn('font-semibold text-sm', watchGoal === opt.value ? 'text-[var(--gold)]' : 'text-white')}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                  <Button type="button" variant="gold" size="lg" className="flex-1" onClick={() => setStep(4)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 4: Activity & Training */}
            {step === 4 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-xl font-semibold text-white mb-6">Training Setup</h2>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Activity Level</label>
                  <div className="space-y-2">
                    {[
                      { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                      { value: 'lightly_active', label: 'Lightly Active', desc: '1-3 days/week' },
                      { value: 'moderately_active', label: 'Moderately Active', desc: '3-5 days/week' },
                      { value: 'very_active', label: 'Very Active', desc: '6-7 days/week' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setValue('activity_level', opt.value as ActivityLevel)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex justify-between items-center',
                          watchActivity === opt.value
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Training Location</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'gym', label: 'Gym' },
                      { value: 'home', label: 'Home' },
                      { value: 'both', label: 'Both' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setValue('training_location', opt.value as TrainingLocation)}
                        className={cn(
                          'py-2.5 rounded-lg text-sm font-medium border transition-all',
                          watchLocation === opt.value
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['beginner', 'intermediate', 'advanced'].map(e => (
                      <button key={e} type="button"
                        onClick={() => setValue('training_experience', e as TrainingExperience)}
                        className={cn(
                          'py-2.5 rounded-lg text-sm font-medium border transition-all capitalize',
                          watchExperience === e
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >{e}</button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Training Days Per Week"
                  type="number"
                  placeholder="4"
                  {...register('days_per_week', { required: true, min: 1, max: 7 })}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                  <Button type="button" variant="gold" size="lg" className="flex-1" onClick={() => setStep(5)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 5: Diet */}
            {step === 5 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-xl font-semibold text-white mb-6">Nutrition Preferences</h2>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Allergies / Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {allergyOptions.map(a => (
                      <button key={a} type="button"
                        onClick={() => toggleAllergy(a)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          selectedAllergies.includes(a)
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Food Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {foodPrefOptions.map(p => (
                      <button key={p} type="button"
                        onClick={() => togglePref(p)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          selectedPrefs.includes(p)
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >{p}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Intermittent Fasting</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', label: 'No Fasting' },
                      { value: '16:8', label: '16:8 IF' },
                      { value: '18:6', label: '18:6 IF' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setValue('fasting_preference', opt.value)}
                        className={cn(
                          'py-2.5 rounded-lg text-sm font-medium border transition-all',
                          watchFasting === opt.value
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-gray-400'
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(4)}>Back</Button>
                  <Button type="submit" variant="gold" size="lg" className="flex-1" loading={loading}>
                    {loading ? 'Building Your Plan...' : 'Generate My Plan'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
