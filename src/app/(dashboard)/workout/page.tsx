'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, RefreshCw, ChevronDown, ChevronUp, Clock, Zap, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkoutPlan, WorkoutSession, Exercise } from '@/types'
import { cn } from '@/lib/utils'

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => { fetchPlan() }, [])

  async function fetchPlan() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents/workout')
      const data = await res.json()
      if (!res.ok) {
        console.error('[workout] fetch failed:', res.status, data)
        return
      }
      setPlan(data.plan ?? null)
      if (data.plan?.plan_data?.sessions?.[0]) {
        setExpandedDay(data.plan.plan_data.sessions[0].day)
      }
    } catch (err) {
      console.error('[workout] fetch error:', err)
      toast.error('Failed to load workout plan')
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    setGenerating(true)
    try {
      const res = await fetch('/api/agents/workout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        console.error('[workout] generation failed:', res.status, data)
        if (res.status === 403) {
          window.location.href = '/upgrade?reason=feature'
          return
        }
        toast.error(data?.message ?? data?.error ?? 'Failed to generate workout plan')
        return
      }
      console.log('[workout] plan generated:', data.plan)
      setPlan(data.plan)
      if (data.plan?.plan_data?.sessions?.[0]) {
        setExpandedDay(data.plan.plan_data.sessions[0].day)
      }
      toast.success('Workout plan generated!')
    } catch (err) {
      console.error('[workout] fetch error:', err)
      toast.error('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface-2)] rounded w-1/3" />
          <div className="h-4 bg-[var(--surface-2)] rounded w-1/4" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mb-4">
          <Dumbbell className="w-7 h-7 text-[var(--gold)]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Workout Plan Yet</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">
          Generate your personalized workout plan based on your goals and training profile.
        </p>
        <Button variant="gold" size="lg" onClick={generatePlan} loading={generating}>
          Generate My Workout Plan
        </Button>
      </div>
    )
  }

  const planData = plan.plan_data

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout Plan</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="gold">{planData.split}</Badge>
            <span className="text-gray-500 text-xs">{planData.days_per_week} days/week</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Update Goals
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={generatePlan} loading={generating} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {planData.sessions.map((session: WorkoutSession) => (
          <Card
            key={session.day}
            className={cn(
              'cursor-pointer transition-all',
              expandedDay === session.day ? 'border-[var(--gold)]/30' : 'hover:border-gray-700'
            )}
          >
            <div
              className="flex items-center justify-between"
              onClick={() => setExpandedDay(expandedDay === session.day ? null : session.day)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{session.day}</p>
                  <p className="text-xs text-gray-500">{session.muscle_groups.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {session.duration_minutes}min
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Zap className="w-3 h-3" />
                  {session.exercises.length} exercises
                </div>
                {expandedDay === session.day
                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                  : <ChevronDown className="w-4 h-4 text-gray-500" />
                }
              </div>
            </div>

            {expandedDay === session.day && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                {session.exercises.map((exercise: Exercise, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[var(--gold)]">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{exercise.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--gold)]">{exercise.sets} sets × {exercise.reps}</span>
                        <span className="text-xs text-gray-500">Rest: {exercise.rest_seconds}s</span>
                      </div>
                      {exercise.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">{exercise.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {planData.notes && (
        <Card className="border-[var(--gold)]/20 bg-[var(--gold)]/5">
          <p className="text-xs font-semibold text-[var(--gold)] mb-2">Coach Notes</p>
          <p className="text-sm text-gray-300 leading-relaxed">{planData.notes}</p>
        </Card>
      )}
    </div>
  )
}
