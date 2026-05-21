'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Goal, ActivityLevel, TrainingLocation, TrainingExperience, OnboardingData, UserProfile } from '@/types'


interface FormState {
  full_name:           string
  weight_kg:           string
  goal:                Goal
  activity_level:      ActivityLevel
  training_location:   TrainingLocation
  training_experience: TrainingExperience
  days_per_week:       string
  allergies:           string[]
  food_preferences:    string[]
  fasting_preference:  string
}

const DEFAULT_FORM: FormState = {
  full_name:           '',
  weight_kg:           '',
  goal:                'fat_loss',
  activity_level:      'moderately_active',
  training_location:   'gym',
  training_experience: 'intermediate',
  days_per_week:       '4',
  allergies:           [],
  food_preferences:    [],
  fasting_preference:  'none',
}

const inputCls = 'w-full px-4 py-2.5 bg-[#111111] border border-[#242424] rounded-xl text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors'

export default function SettingsPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [email,        setEmail]        = useState('')
  const [tier,         setTier]         = useState<string>('free')
  const [form,         setForm]         = useState<FormState>(DEFAULT_FORM)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const [{ data: profile }, { data: onboarding }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('onboarding_data').select('*').eq('user_id', user.id).single(),
      ])

      setTier((profile as UserProfile | null)?.subscription_tier ?? 'free')

      const p = profile as UserProfile | null
      const o = onboarding as OnboardingData | null

      setForm({
        full_name:           p?.full_name ?? '',
        weight_kg:           o?.weight_kg?.toString() ?? '',
        goal:                o?.goal ?? 'fat_loss',
        activity_level:      o?.activity_level ?? 'moderately_active',
        training_location:   o?.training_location ?? 'gym',
        training_experience: o?.training_experience ?? 'intermediate',
        days_per_week:       o?.days_per_week?.toString() ?? '4',
        allergies:           o?.allergies ?? [],
        food_preferences:    o?.food_preferences ?? [],
        fasting_preference:  o?.fasting_preference ?? 'none',
      })
    } catch (err) {
      console.error('[settings] load error:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleArray(key: 'allergies' | 'food_preferences', item: string) {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(x => x !== item)
        : [...prev[key], item],
    }))
  }

  async function saveData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const days   = parseInt(form.days_per_week, 10)
    const weight = parseFloat(form.weight_kg)

    if (isNaN(days) || days < 1 || days > 7) {
      toast.error('Training days must be between 1 and 7')
      return
    }
    if (isNaN(weight) || weight < 30 || weight > 300) {
      toast.error('Please enter a valid weight (30–300 kg)')
      return
    }

    const [profileRes, onboardingRes] = await Promise.all([
      supabase.from('user_profiles')
        .update({ full_name: form.full_name.trim() || null })
        .eq('id', user.id),
      supabase.from('onboarding_data').upsert({
        user_id:             user.id,
        weight_kg:           weight,
        goal:                form.goal,
        activity_level:      form.activity_level,
        training_location:   form.training_location,
        training_experience: form.training_experience,
        days_per_week:       days,
        allergies:           form.allergies,
        food_preferences:    form.food_preferences,
        fasting_preference:  form.fasting_preference === 'none' ? null : form.fasting_preference,
      }, { onConflict: 'user_id' }),
    ])

    if (profileRes.error)    throw profileRes.error
    if (onboardingRes.error) throw onboardingRes.error
  }

  async function handleSaveOnly() {
    setSaving(true)
    try {
      await saveData()
      toast.success('Settings saved!')
    } catch (err) {
      console.error('[settings] save error:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndRegenerate() {
    setRegenerating(true)
    try {
      await saveData()
      toast.success('Settings saved — regenerating your plans…')

      const [workoutRes, nutritionRes] = await Promise.allSettled([
        fetch('/api/agents/workout',   { method: 'POST' }),
        fetch('/api/agents/nutrition', { method: 'POST' }),
      ])

      const workoutOk   = workoutRes.status   === 'fulfilled' && workoutRes.value.ok
      const nutritionOk = nutritionRes.status === 'fulfilled' && nutritionRes.value.ok

      if (workoutOk && nutritionOk) {
        toast.success('Plans regenerated — redirecting…')
        router.push('/workout')
      } else if (workoutOk) {
        toast.success('Workout plan regenerated!')
        toast.error('Nutrition plan failed — try regenerating manually')
        router.push('/workout')
      } else if (nutritionOk) {
        toast.success('Nutrition plan regenerated!')
        toast.error('Workout plan failed — try regenerating manually')
        router.push('/nutrition')
      } else {
        toast.error('Plans could not be regenerated — upgrade to King Pro or try again')
      }
    } catch (err) {
      console.error('[settings] regen error:', err)
      toast.error('Something went wrong')
    } finally {
      setRegenerating(false)
    }
  }

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 pt-14 pb-32 space-y-4 animate-pulse">
          <div className="h-8 bg-[#161616] rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[#1a1a1a] border-2 border-[#C9A84C]/20 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-32">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-[#505050] uppercase tracking-widest">Profile</p>
          <h1 className="text-3xl font-black text-white mt-0.5">Settings</h1>
          <p className="text-sm text-[#505050] mt-1">Update your profile, goals, and preferences</p>
        </div>

        {/* ── ACCOUNT ─────────────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border-2 border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
          <p className="text-sm text-[#C9A84C] uppercase tracking-widest font-semibold mb-4">Account</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#505050] mb-1.5">Full Name</p>
              <input
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs text-[#505050] mb-1.5">Email</p>
              <div className="w-full px-4 py-2.5 bg-[#111111] border border-[#242424] rounded-xl text-[#505050] text-sm">
                {email || '—'}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#505050] mb-1.5">Subscription</p>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] border border-[#C9A84C]/20 rounded-xl">
                <span className="text-[#C9A84C] text-sm font-semibold">
                  {tier === 'pro' ? '👑 King Pro' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── GOAL & WEIGHT ────────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border-2 border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
          <p className="text-sm text-[#C9A84C] uppercase tracking-widest font-semibold mb-4">Goal &amp; Weight</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#505050] mb-1.5">Current Weight (kg)</p>
              <input
                type="number"
                value={form.weight_kg}
                onChange={e => set('weight_kg', e.target.value)}
                placeholder="e.g. 80"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs text-[#505050] mb-2">Primary Goal</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'fat_loss',    label: 'Fat Loss',      desc: 'Burn fat, get lean & defined'  },
                  { value: 'muscle_gain', label: 'Muscle Gain',   desc: 'Build size and strength'       },
                  { value: 'recomp',      label: 'Recomposition', desc: 'Build muscle while losing fat' },
                  { value: 'maintenance', label: 'Maintenance',   desc: 'Stay fit, maintain physique'   },
                ].map(g => (
                  <button
                    key={g.value}
                    onClick={() => set('goal', g.value as Goal)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border transition-all',
                      form.goal === g.value
                        ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#242424] bg-[#111111] text-[#505050] hover:border-[#404040] hover:text-[#909090]'
                    )}
                  >
                    <p className="text-sm font-medium">{g.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TRAINING SETUP ───────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border-2 border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
          <p className="text-sm text-[#C9A84C] uppercase tracking-widest font-semibold mb-4">Training Setup</p>
          <div className="space-y-4">

            {/* Activity Level */}
            <div>
              <p className="text-xs text-[#505050] mb-2">Activity Level</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'sedentary',         label: 'Sedentary',         desc: 'Little to no exercise' },
                  { value: 'lightly_active',    label: 'Lightly Active',    desc: '1–3 days/week'         },
                  { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week'         },
                  { value: 'very_active',       label: 'Very Active',       desc: '6–7 days/week'         },
                ].map(a => (
                  <button
                    key={a.value}
                    onClick={() => set('activity_level', a.value as ActivityLevel)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                      form.activity_level === a.value
                        ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#242424] bg-[#111111] text-[#505050] hover:border-[#404040] hover:text-[#909090]'
                    )}
                  >
                    <span className="text-sm font-medium">{a.label}</span>
                    <span className="text-xs opacity-70">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Training Location */}
            <div>
              <p className="text-xs text-[#505050] mb-2">Training Location</p>
              <div className="grid grid-cols-3 gap-2">
                {(['gym', 'home', 'both'] as TrainingLocation[]).map(loc => (
                  <button
                    key={loc}
                    onClick={() => set('training_location', loc)}
                    className={cn(
                      'py-2.5 rounded-xl border text-sm font-medium transition-all capitalize',
                      form.training_location === loc
                        ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#242424] bg-[#111111] text-[#505050] hover:border-[#404040] hover:text-[#909090]'
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <p className="text-xs text-[#505050] mb-2">Experience Level</p>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as TrainingExperience[]).map(exp => (
                  <button
                    key={exp}
                    onClick={() => set('training_experience', exp)}
                    className={cn(
                      'py-2.5 rounded-xl border text-sm font-medium transition-all capitalize',
                      form.training_experience === exp
                        ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#242424] bg-[#111111] text-[#505050] hover:border-[#404040] hover:text-[#909090]'
                    )}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Days */}
            <div>
              <p className="text-xs text-[#505050] mb-2">Training Days Per Week</p>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => set('days_per_week', String(d))}
                    className={cn(
                      'py-2.5 rounded-xl border text-sm font-bold transition-all',
                      Number(form.days_per_week) === d
                        ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#242424] bg-[#111111] text-[#505050] hover:border-[#404040] hover:text-[#909090]'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-4 mb-4">
            <p className="text-green-400 text-sm font-medium">✓ Settings saved successfully</p>
          </div>
        )}

      </div>

      {/* ── FIXED SAVE BUTTON ────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 z-40">
        <div className="max-w-lg mx-auto pb-2">
          <button
            onClick={handleSaveOnly}
            disabled={saving || regenerating}
            className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
            style={{ boxShadow: (saving || regenerating) ? 'none' : '0 0 24px rgba(201,168,76,0.2)' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

    </div>
  )
}
