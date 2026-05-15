'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { WeightChart } from '@/components/progress/weight-chart'
import { ScoreTrendChart } from '@/components/progress/score-trend-chart'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Flame, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface-2)] rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (checkins.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mb-4">
          <TrendingUp className="w-7 h-7 text-[var(--gold)]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Complete your first daily check-in to start tracking your transformation progress.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Track your transformation journey</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--gold)]">{streak}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{workoutAdherence}%</p>
              <p className="text-xs text-gray-500">Workout Adherence (7d)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{nutritionAdherence}%</p>
              <p className="text-xs text-gray-500">Nutrition Adherence (7d)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Score Trends */}
      {scoreHistory.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Score Trends (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weight Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart checkins={checkins} />
        </CardContent>
      </Card>

      {/* Recent check-ins table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-Ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-[var(--border)]">
                  <th className="text-left pb-3">Date</th>
                  <th className="text-center pb-3">Energy</th>
                  <th className="text-center pb-3">Mood</th>
                  <th className="text-center pb-3">Weight</th>
                  <th className="text-center pb-3">Workout</th>
                  <th className="text-center pb-3">Nutrition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {last7.map(c => (
                  <tr key={c.id} className="text-gray-300">
                    <td className="py-3 text-xs text-gray-400">{formatDate(c.date)}</td>
                    <td className="py-3 text-center">
                      <span className={`font-medium ${c.energy_level >= 7 ? 'text-green-400' : c.energy_level >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {c.energy_level}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-medium ${c.mood >= 7 ? 'text-green-400' : c.mood >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {c.mood}
                      </span>
                    </td>
                    <td className="py-3 text-center text-xs">
                      {c.weight_kg ? `${c.weight_kg}kg` : '—'}
                    </td>
                    <td className="py-3 text-center">
                      {c.adherence_workout
                        ? <span className="text-green-400 text-xs">✓</span>
                        : <span className="text-red-400 text-xs">✗</span>}
                    </td>
                    <td className="py-3 text-center">
                      {c.adherence_nutrition
                        ? <span className="text-green-400 text-xs">✓</span>
                        : <span className="text-red-400 text-xs">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
