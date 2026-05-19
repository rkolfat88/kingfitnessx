'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Crown, RefreshCw } from 'lucide-react'
import type { Goal, ActivityLevel, TrainingLocation, TrainingExperience } from '@/types'

interface OnboardingFormData {
  age:                 number
  gender:              string
  height_cm:           number
  weight_kg:           number
  goal:                Goal
  activity_level:      ActivityLevel
  training_location:   TrainingLocation
  training_experience: TrainingExperience
  days_per_week:       number
  allergies:           string[]
  food_preferences:    string[]
  fasting_preference:  string
}

const TOTAL_STEPS = 5

const goalOptions: { value: Goal; label: string; desc: string }[] = [
  { value: 'fat_loss',    label: 'Fat Loss',        desc: 'Burn fat, get lean & defined'          },
  { value: 'muscle_gain', label: 'Muscle Gain',     desc: 'Build size and strength'               },
  { value: 'recomp',      label: 'Recomposition',   desc: 'Build muscle while losing fat'         },
  { value: 'maintenance', label: 'Maintenance',     desc: 'Stay fit, maintain current physique'   },
]

const allergyOptions  = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Fish', 'Shellfish']
const foodPrefOptions = ['High Protein', 'Low Carb', 'Vegetarian', 'Vegan', 'Mediterranean', 'Meal Prep Friendly']

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-3 bg-[#0F0F0F] border border-[#242424] rounded-xl text-sm text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors'

export function OnboardingForm({ userId }: { userId: string }) {
  const [step,               setStep]               = useState(1)
  const [loading,            setLoading]            = useState(false)
  const [selectedAllergies,  setSelectedAllergies]  = useState<string[]>([])
  const [selectedPrefs,      setSelectedPrefs]      = useState<string[]>([])
  const router   = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingFormData>({
    defaultValues: {
      goal:                'fat_loss',
      activity_level:      'moderately_active',
      training_location:   'gym',
      training_experience: 'intermediate',
      days_per_week:       4,
      gender:              'male',
      fasting_preference:  'none',
    },
  })

  const watchGoal       = watch('goal')
  const watchLocation   = watch('training_location')
  const watchExperience = watch('training_experience')
  const watchActivity   = watch('activity_level')
  const watchGender     = watch('gender')
  const watchFasting    = watch('fasting_preference')

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
        user_id:             userId,
        age:                 Number(data.age),
        gender:              data.gender,
        height_cm:           Number(data.height_cm),
        weight_kg:           Number(data.weight_kg),
        goal:                data.goal,
        activity_level:      data.activity_level,
        training_location:   data.training_location,
        training_experience: data.training_experience,
        days_per_week:       Number(data.days_per_week),
        allergies:           selectedAllergies,
        food_preferences:    selectedPrefs,
        fasting_preference:  data.fasting_preference === 'none' ? null : data.fasting_preference,
      }, { onConflict: 'user_id' })

      if (onboardingError) throw onboardingError

      await supabase.from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)

      await Promise.allSettled([
        fetch('/api/agents/workout',   { method: 'POST' }),
        fetch('/api/agents/nutrition', { method: 'POST' }),
      ])

      toast.success('Your personalized plan is ready!')
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/home?new=true')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  // ── Reusable chip button ──────────────────────────────────────────────────
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
          : 'bg-[#161616] border-[#242424] text-[#909090] hover:border-[#404040]'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex items-start justify-center pt-12 px-4 pb-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-3">
            <Crown className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <h1 className="text-xl font-bold text-white">Build Your Plan</h1>
          <p className="text-[#505050] text-xs mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[#1E1E1E] rounded-full mb-6">
          <div
            className="h-1 bg-[#C9A84C] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── Step 1: Basic Info ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white">Basic Information</h2>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue('gender', g)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                          watchGender === g
                            ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                        )}
                      >{g}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Age</label>
                  <input
                    type="number"
                    placeholder="25"
                    {...register('age', { required: true, min: 16, max: 80 })}
                    className={inputCls}
                  />
                  {errors.age && <p className="text-xs text-red-400 mt-1">Please enter a valid age (16–80)</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl text-sm transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Body Metrics ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white">Body Metrics</h2>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    {...register('height_cm', { required: true, min: 100, max: 250 })}
                    className={inputCls}
                  />
                  {errors.height_cm && <p className="text-xs text-red-400 mt-1">Enter height in cm</p>}
                </div>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    {...register('weight_kg', { required: true, min: 30, max: 300 })}
                    className={inputCls}
                  />
                  {errors.weight_kg && <p className="text-xs text-red-400 mt-1">Enter weight in kg</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-[#1E1E1E] border border-[#242424] hover:border-[#404040] text-[#909090] font-semibold py-3 rounded-xl text-sm transition-all">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-1 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl text-sm transition-all">Continue</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Goals ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white">Your Primary Goal</h2>

                <div className="space-y-2">
                  {goalOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('goal', opt.value)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border transition-all',
                        watchGoal === opt.value
                          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40'
                          : 'bg-[#0F0F0F] border-[#242424] hover:border-[#404040]'
                      )}
                    >
                      <p className={cn('font-semibold text-sm', watchGoal === opt.value ? 'text-[#C9A84C]' : 'text-white')}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-[#505050] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 bg-[#1E1E1E] border border-[#242424] hover:border-[#404040] text-[#909090] font-semibold py-3 rounded-xl text-sm transition-all">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-1 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl text-sm transition-all">Continue</button>
                </div>
              </div>
            )}

            {/* ── Step 4: Training ── */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">Training Setup</h2>

                {/* Activity */}
                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Activity Level</label>
                  <div className="space-y-2">
                    {[
                      { value: 'sedentary',         label: 'Sedentary',         desc: 'Little to no exercise' },
                      { value: 'lightly_active',    label: 'Lightly Active',    desc: '1–3 days/week'         },
                      { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week'         },
                      { value: 'very_active',       label: 'Very Active',       desc: '6–7 days/week'         },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('activity_level', opt.value as ActivityLevel)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex justify-between items-center',
                          watchActivity === opt.value
                            ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                        )}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Training Location</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gym', 'home', 'both'] as const).map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setValue('training_location', loc)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                          watchLocation === loc
                            ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                        )}
                      >{loc}</button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setValue('training_experience', e)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                          watchExperience === e
                            ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                        )}
                      >{e}</button>
                    ))}
                  </div>
                </div>

                {/* Days per week */}
                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Training Days Per Week</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map(d => {
                      const cur = Number(watch('days_per_week'))
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setValue('days_per_week', d)}
                          className={cn(
                            'py-2.5 rounded-xl text-sm font-bold border transition-all',
                            cur === d
                              ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                              : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                          )}
                        >{d}</button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 bg-[#1E1E1E] border border-[#242424] hover:border-[#404040] text-[#909090] font-semibold py-3 rounded-xl text-sm transition-all">Back</button>
                  <button type="button" onClick={() => setStep(5)} className="flex-1 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl text-sm transition-all">Continue</button>
                </div>
              </div>
            )}

            {/* ── Step 5: Nutrition ── */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">Nutrition Preferences</h2>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Allergies / Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {allergyOptions.map(a => (
                      <Chip key={a} active={selectedAllergies.includes(a)} onClick={() => toggleAllergy(a)}>{a}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Food Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {foodPrefOptions.map(p => (
                      <Chip key={p} active={selectedPrefs.includes(p)} onClick={() => togglePref(p)}>{p}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#909090] uppercase tracking-widest mb-2 block">Intermittent Fasting</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', label: 'No Fasting' },
                      { value: '16:8', label: '16:8 IF'    },
                      { value: '18:6', label: '18:6 IF'    },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('fasting_preference', opt.value)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-medium border transition-all',
                          watchFasting === opt.value
                            ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-[#0F0F0F] border-[#242424] text-[#909090] hover:border-[#404040]'
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex-1 bg-[#1E1E1E] border border-[#242424] hover:border-[#404040] text-[#909090] font-semibold py-3 rounded-xl text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Building…
                      </>
                    ) : 'Generate My Plan'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  )
}
