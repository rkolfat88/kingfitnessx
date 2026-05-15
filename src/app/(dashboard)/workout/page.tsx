'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Dumbbell, RefreshCw, ChevronDown, ChevronUp, Clock, Zap, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkoutPlan, WorkoutSession, Exercise } from '@/types'

export default function WorkoutPage() {
  const [plan,        setPlan]        = useState<WorkoutPlan | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => { fetchPlan() }, [])

  async function fetchPlan() {
    setLoading(true)
    try {
      const res  = await fetch('/api/agents/workout')
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
      const res  = await fetch('/api/agents/workout', { method: 'POST' })
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
      setPlan(data.plan)
      if (data.plan?.plan_data?.sessions?.[0]) {
        setExpandedDay(data.plan.plan_data.sessions[0].day)
      }
      toast.success('Workout plan generated!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[workout] fetch error:', err)
      toast.error('Network error — please try again')
    } finally {
      setGenerating(false)
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
              <div key={i} className="h-16 bg-[#161616] border border-[#242424] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 pt-14 pb-24">
          <div className="py-4">
            <p className="text-xs text-[#505050] uppercase tracking-widest">Training</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Workout Plan</h1>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
              <Dumbbell className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Workout Plan Yet</h2>
            <p className="text-[#909090] text-sm mb-6 max-w-sm">
              Generate your personalized workout plan based on your goals and training profile.
            </p>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="bg-[#C9A84C] hover:bg-[#D4B05A] text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate My Workout Plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const planData = plan.plan_data

  return (
    <div className="bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24">

        {/* HEADER */}
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs text-[#505050] uppercase tracking-widest">Training</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Workout Plan</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <button className="flex items-center gap-1.5 border border-[#242424] text-[#909090] text-xs font-medium px-3 py-2 rounded-xl hover:border-[#404040] transition-all">
                <SlidersHorizontal className="w-3 h-3" />
                Goals
              </button>
            </Link>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#D4B05A] text-black text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* PLAN OVERVIEW */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-2.5 py-1 rounded-full">
                {planData.split}
              </span>
              <p className="text-sm text-[#909090] mt-2">{planData.days_per_week} days / week</p>
            </div>
            <div className="flex items-center gap-1.5 text-[#505050]">
              <Zap className="w-4 h-4" />
              <span className="text-xs">{planData.sessions.length} sessions</span>
            </div>
          </div>
          {planData.notes && (
            <p className="text-xs text-[#505050] mt-3 leading-relaxed line-clamp-2">{planData.notes}</p>
          )}
        </div>

        {/* WORKOUT DAYS */}
        <div className="space-y-3">
          {planData.sessions.map((session: WorkoutSession) => (
            <div key={session.day} className="bg-[#161616] border border-[#242424] rounded-2xl overflow-hidden">

              {/* Day header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer active:bg-[#1c1c1c] transition-colors"
                onClick={() => setExpandedDay(expandedDay === session.day ? null : session.day)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{session.day}</p>
                    <p className="text-xs text-[#909090] mt-0.5">{session.muscle_groups.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#242424] text-[#909090] px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.duration_minutes}m
                  </span>
                  {expandedDay === session.day
                    ? <ChevronUp className="w-4 h-4 text-[#505050]" />
                    : <ChevronDown className="w-4 h-4 text-[#505050]" />
                  }
                </div>
              </div>

              {/* Exercises */}
              {expandedDay === session.day && (
                <div>
                  {session.exercises.map((exercise: Exercise, i: number) => (
                    <div key={i} className="px-4 py-3 border-t border-[#242424]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#242424] text-[#C9A84C] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
                        </div>
                        <p className="text-sm text-[#C9A84C] font-semibold ml-2 flex-shrink-0">{exercise.sets} × {exercise.reps}</p>
                      </div>
                      <p className="text-xs text-[#505050] mt-1 ml-7">Rest: {exercise.rest_seconds}s</p>
                      {exercise.notes && (
                        <p className="text-xs text-[#909090] mt-1 ml-7 italic">{exercise.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
