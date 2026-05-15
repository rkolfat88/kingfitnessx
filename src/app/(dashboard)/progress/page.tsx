'use client'

import { useEffect, useState } from 'react'
import { WeightChart } from '@/components/progress/weight-chart'
import { ScoreTrendChart } from '@/components/progress/score-trend-chart'
import { TrendingUp, Flame } from 'lucide-react'
import type { DailyCheckin } from '@/types'

interface ScoreRow {
  score_date: string
  recovery_score:    number | null
  adherence_score:   number | null
  momentum_score:    number | null
  discipline_rating: number | null
}

export default function ProgressPage() {
  const [checkins,     setCheckins]     = useState<DailyCheckin[]>([])
  const [scoreHistory, setScoreHistory] = useState<ScoreRow[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/check-in').then(r => r.json()),
      fetch('/api/intelligence').then(r => r.json()),
    ]).then(([checkinData, intelligenceData]) => {
      setCheckins(checkinData.checkins || [])
      setScoreHistory(intelligenceData.scores || [])
    }).finally(() => setLoading(false))
  }, [])

  const last7 = checkins.slice(0, 7)

  const workoutAdherence = last7.length > 0
    ? Math.round((last7.filter(c => c.adherence_workout).length / last7.length) * 100)
    : 0

  const nutritionAdherence = last7.length > 0
    ? Math.round((last7.filter(c => c.adherence_nutrition).length / last7.length) * 100)
    : 0

  function calcStreak(): number {
    if (!checkins.length) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < checkins.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const dateStr = expected.toISOString().split('T')[0]
      if (checkins[i].date === dateStr) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const streak = calcStreak()

  const startWeight  = checkins.length ? (checkins[checkins.length - 1].weight_kg ?? null) : null
  const currentWeight = checkins.length ? (checkins[0].weight_kg ?? null) : null
  const weightChange  = startWeight && currentWeight ? +(currentWeight - startWeight).toFixed(1) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 pt-14 pb-24">
          <div className="py-4">
            <div className="h-3 bg-[#242424] rounded w-16 animate-pulse mb-2" />
            <div className="h-7 bg-[#242424] rounded w-40 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-[#161616] border border-[#242424] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-48 bg-[#161616] border border-[#242424] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (checkins.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 pt-14 pb-24">
          <div className="py-4">
            <p className="text-xs text-[#505050] uppercase tracking-widest">Journey</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Progress</h1>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
            <p className="text-[#909090] text-sm max-w-sm">
              Complete your first daily check-in to start tracking your transformation progress.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24 space-y-4">

        {/* HEADER */}
        <div className="py-4">
          <p className="text-xs text-[#505050] uppercase tracking-widest">Journey</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">Progress</h1>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Start Weight</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">{startWeight ?? '—'}</span>
              {startWeight && <span className="text-sm text-[#909090]">kg</span>}
            </div>
          </div>
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Current Weight</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">{currentWeight ?? '—'}</span>
              {currentWeight && <span className="text-sm text-[#909090]">kg</span>}
            </div>
          </div>
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Change</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${weightChange === null ? 'text-white' : weightChange <= 0 ? 'text-green-400' : 'text-[#F97316]'}`}>
                {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange}` : '—'}
              </span>
              {weightChange !== null && <span className="text-sm text-[#909090]">kg</span>}
            </div>
          </div>
          <div className="bg-[#161616] border border-[#C9A84C]/20 rounded-2xl p-4">
            <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xl font-bold text-white">{streak}</span>
              <span className="text-sm text-[#909090]">days</span>
            </div>
          </div>
        </div>

        {/* ADHERENCE */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#505050] mb-4">7-Day Adherence</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#909090]">Workout</span>
                <span className="text-xs font-semibold text-green-400">{workoutAdherence}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#242424] rounded-full">
                <div className="h-1.5 bg-green-400 rounded-full transition-all" style={{ width: `${workoutAdherence}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#909090]">Nutrition</span>
                <span className="text-xs font-semibold text-blue-400">{nutritionAdherence}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#242424] rounded-full">
                <div className="h-1.5 bg-blue-400 rounded-full transition-all" style={{ width: `${nutritionAdherence}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* WEIGHT CHART */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#505050] mb-4">Weight Trend (30 days)</p>
          <WeightChart checkins={checkins} />
        </div>

        {/* SCORE TRENDS */}
        {scoreHistory.length > 0 && (
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#505050] mb-4">Performance Scores (30 days)</p>
            <ScoreTrendChart scores={scoreHistory} />
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { label: 'Recovery',   color: '#22C55E' },
                { label: 'Adherence',  color: '#C9A84C' },
                { label: 'Momentum',   color: '#3B82F6' },
                { label: 'Discipline', color: '#F97316' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-[#505050]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT CHECK-INS */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#505050] mb-4">Recent Check-Ins</p>
          <div className="space-y-2">
            {last7.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#242424] last:border-0">
                <span className="text-xs text-[#505050] w-20 flex-shrink-0">{c.date}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#505050]">E</span>
                    <span className={`text-xs font-semibold ${(c.energy_level ?? 0) >= 7 ? 'text-green-400' : (c.energy_level ?? 0) >= 4 ? 'text-[#C9A84C]' : 'text-red-400'}`}>{c.energy_level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#505050]">M</span>
                    <span className={`text-xs font-semibold ${(c.mood ?? 0) >= 7 ? 'text-green-400' : (c.mood ?? 0) >= 4 ? 'text-[#C9A84C]' : 'text-red-400'}`}>{c.mood}</span>
                  </div>
                  {c.weight_kg && (
                    <span className="text-xs text-[#909090]">{c.weight_kg}kg</span>
                  )}
                  <span className={`text-xs ${c.adherence_workout ? 'text-green-400' : 'text-[#505050]'}`}>
                    {c.adherence_workout ? '✓W' : '✗W'}
                  </span>
                  <span className={`text-xs ${c.adherence_nutrition ? 'text-green-400' : 'text-[#505050]'}`}>
                    {c.adherence_nutrition ? '✓N' : '✗N'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
