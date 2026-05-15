'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Crown, RefreshCw } from 'lucide-react'
import type { Goal, ActivityLevel, TrainingLocation, TrainingExperience, OnboardingData, UserProfile } from '@/types'

const goalOptions: { value: Goal; label: string; desc: string }[] = [
  { value: 'fat_loss',    label: 'Fat Loss',       desc: 'Burn fat, get lean & defined'  },
  { value: 'muscle_gain', label: 'Muscle Gain',    desc: 'Build size and strength'       },
  { value: 'recomp',      label: 'Recomposition',  desc: 'Build muscle while losing fat' },
  { value: 'maintenance', label: 'Maintenance',    desc: 'Stay fit, maintain physique'   },
]

const activityOptions: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary',         label: 'Sedentary',         desc: 'Little to no exercise' },
  { value: 'lightly_active',    label: 'Lightly Active',    desc: '1–3 days/week'         },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week'         },
  { value: 'very_active',       label: 'Very Active',       desc: '6–7 days/week'         },
]

const allergyOptions  = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Fish', 'Shellfish']
const foodPrefOptions = ['High Protein', 'Low Carb', 'Vegetarian', 'Vegan', 'Mediterranean', 'Meal Prep Friendly']

const fastingOptions = [
  { value: 'none', label: 'No Fasting' },
  { value: '16:8', label: '16:8 IF'    },
  { value: '18:6', label: '18:6 IF'    },
]

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

export default function SettingsPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
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

    if (profileRes.error)   throw profileRes.error
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

  const isBusy = saving || regenerating

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-32 space-y-4 animate-pulse">
          <div className="h-7 bg-[var(--surface-2)] rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Chip helper ────────────────────────────────────────────────────────────
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
          : 'bg-[var(--surface-3)] border-[var(--border)] text-gray-400 hover:border-gray-600'
      )}
    >
      {children}
    </button>
  )

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-32">

        {/* Page heading */}
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-6">Update your profile, goals, and training preferences</p>

        {/* ── Account ── */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            👤 Account
          </p>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-0">Full Name</p>
          <Input
            placeholder="Your name"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
          />

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Email</p>
          <input
            readOnly
            value={email}
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--surface-3)] border border-[var(--border)] text-gray-500 cursor-default"
          />

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Subscription</p>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
            <Crown className={cn('w-4 h-4', tier === 'pro' ? 'text-[var(--gold)]' : 'text-gray-600')} />
            <span className={cn('text-sm font-medium', tier === 'pro' ? 'text-[var(--gold)]' : 'text-gray-500')}>
              {tier === 'pro' ? 'King Pro' : 'Free Plan'}
            </span>
            {tier !== 'pro' && (
              <a href="/upgrade" className="ml-auto text-xs text-[var(--gold)] hover:underline">
                Upgrade →
              </a>
            )}
          </div>
        </div>

        {/* ── Goal & Weight ── */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            🎯 Goal &amp; Weight
          </p>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-0">Current Weight (kg)</p>
          <Input
            type="number"
            placeholder="80"
            value={form.weight_kg}
            onChange={e => set('weight_kg', e.target.value)}
          />

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Primary Goal</p>
          <div className="grid grid-cols-1 gap-2">
            {goalOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('goal', opt.value)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all',
                  form.goal === opt.value
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40'
                    : 'bg-[var(--surface-3)] border-[var(--border)] hover:border-gray-600'
                )}
              >
                <p className={cn('font-semibold text-sm', form.goal === opt.value ? 'text-[var(--gold)]' : 'text-white')}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Training ── */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            🏋️ Training Setup
          </p>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-0">Activity Level</p>
          <div className="grid grid-cols-1 gap-2">
            {activityOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('activity_level', opt.value)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center',
                  form.activity_level === opt.value
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40'
                    : 'bg-[var(--surface-3)] border-[var(--border)] hover:border-gray-600'
                )}
              >
                <span className={cn('font-medium text-sm', form.activity_level === opt.value ? 'text-[var(--gold)]' : 'text-white')}>
                  {opt.label}
                </span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Training Location</p>
          <div className="grid grid-cols-3 gap-2">
            {(['gym', 'home', 'both'] as TrainingLocation[]).map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => set('training_location', loc)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                  form.training_location === loc
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--surface-3)] border-[var(--border)] text-gray-400 hover:border-gray-600'
                )}
              >
                {loc}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Experience Level</p>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as TrainingExperience[]).map(exp => (
              <button
                key={exp}
                type="button"
                onClick={() => set('training_experience', exp)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                  form.training_experience === exp
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--surface-3)] border-[var(--border)] text-gray-400 hover:border-gray-600'
                )}
              >
                {exp}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Training Days Per Week</p>
          <Input
            type="number"
            placeholder="4"
            min={1}
            max={7}
            value={form.days_per_week}
            onChange={e => set('days_per_week', e.target.value)}
          />
        </div>

        {/* ── Nutrition ── */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            🥗 Nutrition Preferences
          </p>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 mt-0">Allergies / Restrictions</p>
          <div className="flex flex-wrap gap-2">
            {allergyOptions.map(a => (
              <Chip key={a} active={form.allergies.includes(a)} onClick={() => toggleArray('allergies', a)}>
                {a}
              </Chip>
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 mt-4">Food Preferences</p>
          <div className="flex flex-wrap gap-2">
            {foodPrefOptions.map(p => (
              <Chip key={p} active={form.food_preferences.includes(p)} onClick={() => toggleArray('food_preferences', p)}>
                {p}
              </Chip>
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">Intermittent Fasting</p>
          <div className="grid grid-cols-3 gap-2">
            {fastingOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('fasting_preference', opt.value)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium border transition-all',
                  form.fasting_preference === opt.value
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--surface-3)] border-[var(--border)] text-gray-400 hover:border-gray-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Regenerate Plans ── */}
        {tier === 'pro' && (
          <div className="bg-[var(--gold)]/5 border border-[var(--gold)]/20 rounded-2xl p-5 mb-4">
            <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--gold)]" />
              Regenerate Plans
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Save your settings and immediately rebuild your workout and nutrition plans.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={handleSaveAndRegenerate}
              loading={regenerating}
              disabled={isBusy}
            >
              <RefreshCw className="w-4 h-4" />
              Save &amp; Regenerate Plans
            </Button>
          </div>
        )}

      </div>

      {/* ── Sticky Save Button ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSaveOnly}
            loading={saving}
            disabled={isBusy}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
