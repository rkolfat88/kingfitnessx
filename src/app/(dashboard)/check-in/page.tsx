'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { DailyCheckin } from '@/types'

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm font-bold text-[var(--gold)]">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-[var(--surface-3)] rounded-full accent-[var(--gold)] cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>1</span><span>10</span>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${value ? 'bg-[var(--gold)]' : 'bg-[var(--surface-3)]'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
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

  useEffect(() => {
    fetchTodayCheckin()
  }, [])

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
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface-2)] rounded w-1/3" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Daily Check-In</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(today)}</p>
      </div>

      {existing ? (
        <div className="space-y-4">
          <Card className="border-[var(--gold)]/20 bg-[var(--gold)]/5">
            <p className="text-xs font-semibold text-[var(--gold)] mb-1">Today's Check-In Complete</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{existing.energy_level}</p>
                <p className="text-xs text-gray-500">Energy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{existing.mood}</p>
                <p className="text-xs text-gray-500">Mood</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{existing.soreness_level}</p>
                <p className="text-xs text-gray-500">Soreness</p>
              </div>
            </div>
            {existing.weight_kg && (
              <p className="text-sm text-gray-400 mt-3">Weight logged: <span className="text-white font-medium">{existing.weight_kg}kg</span></p>
            )}
          </Card>

          {existing.ai_response && (
            <Card>
              <p className="text-xs font-semibold text-[var(--gold)] mb-3">Coach Response</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{existing.ai_response.message}</p>
              {existing.ai_response.adjustments.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {existing.ai_response.adjustments.map((adj, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[var(--gold)] mt-0.5">→</span>
                      <p className="text-xs text-gray-400">{adj}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-3 mt-3">
                <p className="text-xs text-[var(--gold)] italic">"{existing.ai_response.motivation}"</p>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">How are you feeling?</h3>
            <div className="space-y-5">
              <Slider label="Energy Level" value={energy} onChange={setEnergy} />
              <Slider label="Soreness Level" value={soreness} onChange={setSoreness} />
              <Slider label="Mood" value={mood} onChange={setMood} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Adherence</h3>
            <div className="space-y-3">
              <Toggle label="Completed today's workout" value={workoutDone} onChange={setWorkoutDone} />
              <Toggle label="Followed nutrition plan" value={nutritionDone} onChange={setNutritionDone} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Optional</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="80.5"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  step="0.1"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--surface-2)] border border-[var(--border)] text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold)]/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Notes</label>
                <textarea
                  placeholder="How was your day? Any notes for your coach..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--surface-2)] border border-[var(--border)] text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold)]/50 resize-none"
                />
              </div>
            </div>
          </Card>

          <Button type="submit" variant="gold" size="lg" className="w-full" loading={submitting}>
            Submit Check-In
          </Button>
        </form>
      )}
    </div>
  )
}
