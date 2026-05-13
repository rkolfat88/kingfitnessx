'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Apple, RefreshCw, Clock, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { NutritionPlan, Meal } from '@/types'

export default function NutritionPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchPlan() }, [])

  async function fetchPlan() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents/nutrition')
      const data = await res.json()
      if (!res.ok) {
        console.error('[nutrition] fetch failed:', res.status, data)
        return
      }
      setPlan(data.plan ?? null)
    } catch (err) {
      console.error('[nutrition] fetch error:', err)
      toast.error('Failed to load nutrition plan')
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    setGenerating(true)
    try {
      const res = await fetch('/api/agents/nutrition', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        console.error('[nutrition] generation failed:', res.status, data)
        if (res.status === 403) {
          window.location.href = '/upgrade?reason=feature'
          return
        }
        toast.error(data?.message ?? data?.error ?? 'Failed to generate nutrition plan')
        return
      }
      console.log('[nutrition] plan generated:', data.plan)
      setPlan(data.plan)
      toast.success('Nutrition plan generated!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[nutrition] fetch error:', err)
      toast.error('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="px-4 sm:px-6 pt-14 pb-5 border-b border-[var(--border)]">
          <div className="h-8 bg-[var(--surface-2)] rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-[var(--surface-2)] rounded w-1/2 mt-2 animate-pulse" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-black">
        <div className="px-4 sm:px-6 pt-14 pb-5 border-b border-[var(--border)]">
          <h1 className="text-2xl font-bold text-white">Nutrition Plan</h1>
          <p className="text-gray-500 text-sm mt-1">Your personalized macros and meal schedule</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mb-4">
            <Apple className="w-7 h-7 text-[var(--gold)]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Nutrition Plan Yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            Generate your personalized nutrition plan tailored to your goals and preferences.
          </p>
          <Button variant="gold" size="lg" onClick={generatePlan} loading={generating}>
            {generating ? 'Generating...' : 'Generate My Nutrition Plan'}
          </Button>
        </div>
      </div>
    )
  }

  const pd = plan.plan_data
  const macroTotal = pd.protein_g + pd.carbs_g + pd.fat_g
  const proteinPct = Math.round((pd.protein_g * 4 / pd.daily_calories) * 100)
  const carbsPct = Math.round((pd.carbs_g * 4 / pd.daily_calories) * 100)
  const fatPct = Math.round((pd.fat_g * 9 / pd.daily_calories) * 100)

  return (
    <div className="min-h-screen bg-black">
      {/* Page header */}
      <div className="px-4 sm:px-6 pt-14 pb-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Nutrition Plan</h1>
            <p className="text-gray-500 text-sm mt-1">Personalized macros and meal timing</p>
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
      </div>

    <div className="p-4 sm:p-6 lg:p-8">

      {/* Macros summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-[var(--gold)]/30 bg-[var(--gold)]/5 text-center">
          <p className="text-2xl font-bold text-[var(--gold)]">{pd.daily_calories}</p>
          <p className="text-xs text-gray-500 mt-1">Daily Calories</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-400">{pd.protein_g}g</p>
          <p className="text-xs text-gray-500 mt-1">Protein ({proteinPct}%)</p>
          <div className="w-full h-1 bg-[var(--surface-3)] rounded-full mt-2">
            <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${proteinPct}%` }} />
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-400">{pd.carbs_g}g</p>
          <p className="text-xs text-gray-500 mt-1">Carbs ({carbsPct}%)</p>
          <div className="w-full h-1 bg-[var(--surface-3)] rounded-full mt-2">
            <div className="h-1 bg-green-400 rounded-full" style={{ width: `${carbsPct}%` }} />
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-400">{pd.fat_g}g</p>
          <p className="text-xs text-gray-500 mt-1">Fat ({fatPct}%)</p>
          <div className="w-full h-1 bg-[var(--surface-3)] rounded-full mt-2">
            <div className="h-1 bg-orange-400 rounded-full" style={{ width: `${fatPct}%` }} />
          </div>
        </Card>
      </div>

      {/* Meals */}
      <h2 className="text-lg font-semibold text-white mb-4">Daily Meal Schedule</h2>
      <div className="space-y-4 mb-6">
        {pd.meals.map((meal: Meal, i: number) => (
          <Card key={i}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{meal.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{meal.time}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--gold)]">{meal.calories} cal</p>
                <p className="text-xs text-gray-500">P: {meal.protein_g}g · C: {meal.carbs_g}g · F: {meal.fat_g}g</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {meal.foods.map((food, j) => (
                <span key={j} className="text-xs px-2.5 py-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-gray-300">
                  {food}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {pd.notes && (
        <Card className="border-[var(--gold)]/20 bg-[var(--gold)]/5">
          <p className="text-xs font-semibold text-[var(--gold)] mb-2">Nutrition Notes</p>
          <p className="text-sm text-gray-300 leading-relaxed">{pd.notes}</p>
        </Card>
      )}
    </div>
    </div>
  )
}
