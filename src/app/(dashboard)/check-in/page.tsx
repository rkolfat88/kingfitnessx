'use client'

import { useEffect, useState } from 'react'
import { Activity, CheckCircle, Circle, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { DailyCheckin } from '@/types'

function Slider({ label, value, onChange, color = '#C9A84C' }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#909090]">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}<span className="text-[#505050] font-normal">/10</span></span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-[#242424] rounded-full cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 bg-black/30 rounded-xl border border-[#242424] transition-all"
    >
      <span className="text-sm text-[#909090]">{label}</span>
      <div className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-[#C9A84C]' : 'bg-[#242424]'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
      </div>
    </button>
  )
}

export default function CheckInPage() {
  const today = new Date().toISOString().split('T')[0]
  const [existing, setExisting] = useState<DailyCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [energy, setEnergy] = useState(7)
  const [soreness, setSoreness] = useState(3)
  const [mood, setMood] = useState(7)
  const [workoutDone, setWorkoutDone] = useState(false)
  const [nutritionDone, setNutritionDone] = useState(false)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchTodayCheckin() }, [])

  async function fetchTodayCheckin() {
    setLoading(true)
    try {
      const res = await fetch('/api/check-in')
      const data = await res.json()
      const todayEntry = data.checkins?.find((c: DailyCheckin) => c.date === today)
      if (todayEntry) setExisting(todayEntry)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energy_level: energy,
          soreness_level: soreness,
          mood,
          adherence_workout: workoutDone,
          adherence_nutrition: nutritionDone,
          weight_kg: weight ? Number(weight) : null,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExisting(data.checkin)
      toast.success('Check-in saved!')
    } catch {
      toast.error('Failed to save check-in')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 pt-14 pb-24">
          <div className="py-4">
            <div className="h-3 bg-[#242424] rounded w-16 animate-pulse mb-2" />
            <div className="h-7 bg-[#242424] rounded w-40 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#161616] border border-[#242424] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24">

        {/* HEADER */}
        <div className="py-6">
          <p className="text-sm text-[#505050] uppercase tracking-widest">Daily</p>
          <h1 className="text-3xl font-black text-white mt-0.5">Check-In</h1>
          <p className="text-xs text-[#505050] mt-1">{formatDate(today)}</p>
        </div>

        {existing ? (
          <div className="space-y-4">
            {/* Completed state */}
            <div className="bg-[#161616] border border-[#C9A84C]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-[#C9A84C]" />
                <p className="text-sm font-semibold text-[#C9A84C] uppercase tracking-widest">Today Complete</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Energy',   value: existing.energy_level,   color: '#C9A84C' },
                  { label: 'Mood',     value: existing.mood,            color: '#22C55E' },
                  { label: 'Soreness', value: existing.soreness_level,  color: '#F97316' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-black/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-[10px] text-[#505050] mt-0.5">{label}</p>
                    <div className="w-full h-1 bg-[#242424] rounded-full mt-2">
                      <div className="h-1 rounded-full" style={{ width: `${(value ?? 0) * 10}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${existing.adherence_workout ? 'bg-green-400/10 text-green-400' : 'bg-[#242424] text-[#505050]'}`}>
                  {existing.adherence_workout ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  Workout
                </div>
                <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${existing.adherence_nutrition ? 'bg-green-400/10 text-green-400' : 'bg-[#242424] text-[#505050]'}`}>
                  {existing.adherence_nutrition ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  Nutrition
                </div>
                {existing.weight_kg && (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Activity className="w-3.5 h-3.5" />
                    {existing.weight_kg}kg
                  </div>
                )}
              </div>
            </div>

            {/* AI Coach Response */}
            {existing.ai_response && (
              <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[#C9A84C]" />
                  <p className="text-sm font-semibold text-[#C9A84C] uppercase tracking-widest">Coach Response</p>
                </div>
                <p className="text-sm text-[#909090] leading-relaxed mb-3">{existing.ai_response.message}</p>
                {existing.ai_response.adjustments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {existing.ai_response.adjustments.map((adj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#C9A84C] mt-0.5 text-xs">→</span>
                        <p className="text-xs text-[#909090]">{adj}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-[#242424] pt-3 mt-3">
                  <p className="text-xs text-[#C9A84C] italic">"{existing.ai_response.motivation}"</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Metrics */}
            <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">How are you feeling?</p>
              <div className="space-y-5">
                <Slider label="Energy Level"   value={energy}   onChange={setEnergy}   color="#C9A84C" />
                <Slider label="Soreness Level" value={soreness} onChange={setSoreness} color="#F97316" />
                <Slider label="Mood"           value={mood}     onChange={setMood}     color="#22C55E" />
              </div>
            </div>

            {/* Adherence */}
            <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">Adherence</p>
              <div className="space-y-3">
                <Toggle label="Completed today's workout"  value={workoutDone}   onChange={setWorkoutDone} />
                <Toggle label="Followed nutrition plan"    value={nutritionDone} onChange={setNutritionDone} />
              </div>
            </div>

            {/* Optional */}
            <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">Optional</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#909090] block mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="80.5"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/40 border border-[#242424] text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#909090] block mb-1.5">Notes for your coach</label>
                  <textarea
                    placeholder="How was your day? Any notes for your coach..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/40 border border-[#242424] text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-[#C9A84C] hover:bg-[#D4B05A] text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                : <><CheckCircle className="w-4 h-4" /> Submit Check-In</>
              }
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
