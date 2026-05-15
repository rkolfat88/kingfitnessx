'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Apple, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { NutritionPlan, Meal } from '@/types'

export default function NutritionPage() {
  const [plan,       setPlan]       = useState<NutritionPlan | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchPlan() }, [])

  async function fetchPlan() {
    setLoading(true)
    try {
      const res  = await fetch('/api/agents/nutrition')
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
      const res  = await fetch('/api/agents/nutrition', { method: 'POST' })
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
        <div className="max-w-lg mx-auto px-4 pt-14 pb-24">
          <div className="py-4">
            <div className="h-3 bg-[#242424] rounded w-16 animate-pulse mb-2" />
            <div className="h-7 bg-[#242424] rounded w-40 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#161616] border border-[#242424] rounded-2xl animate-pulse" />
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
            <p className="text-xs text-[#505050] uppercase tracking-widest">Fuel</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Nutrition Plan</h1>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
              <Apple className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Nutrition Plan Yet</h2>
            <p className="text-[#909090] text-sm mb-6 max-w-sm">
              Generate your personalized nutrition plan tailored to your goals and preferences.
            </p>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="bg-[#C9A84C] hover:bg-[#D4B05A] text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Apple className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate My Nutrition Plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pd          = plan.plan_data
  const proteinPct  = Math.round((pd.protein_g * 4 / pd.daily_calories) * 100)
  const carbsPct    = Math.round((pd.carbs_g   * 4 / pd.daily_calories) * 100)
  const fatPct      = Math.round((pd.fat_g     * 9 / pd.daily_calories) * 100)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24">

        {/* HEADER */}
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs text-[#505050] uppercase tracking-widest">Fuel</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Nutrition Plan</h1>
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

        {/* MACRO SUMMARY CARD */}
        <div className="bg-[#161616] border border-[#C9A84C]/20 rounded-2xl p-4 mb-4">
          <div className="text-center mb-4">
            <p className="text-3xl font-black text-white">{pd.daily_calories}</p>
            <p className="text-xs text-[#505050] mt-1 uppercase tracking-widest">calories / day</p>
          </div>
          <div className="space-y-3">
            {/* Protein */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#909090]">Protein</span>
                <span className="text-xs font-semibold text-green-400">{pd.protein_g}g · {proteinPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#242424] rounded-full">
                <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${proteinPct}%` }} />
              </div>
            </div>
            {/* Carbs */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#909090]">Carbs</span>
                <span className="text-xs font-semibold text-blue-400">{pd.carbs_g}g · {carbsPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#242424] rounded-full">
                <div className="h-1.5 bg-blue-400 rounded-full" style={{ width: `${carbsPct}%` }} />
              </div>
            </div>
            {/* Fat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#909090]">Fat</span>
                <span className="text-xs font-semibold text-[#C9A84C]">{pd.fat_g}g · {fatPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#242424] rounded-full">
                <div className="h-1.5 bg-[#C9A84C] rounded-full" style={{ width: `${fatPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* MEALS */}
        <p className="text-xs uppercase tracking-widest text-[#505050] mb-3">Daily Meals</p>
        <div>
          {pd.meals.map((meal: Meal, i: number) => (
            <div key={i} className="bg-[#161616] border border-[#242424] rounded-2xl p-4 mb-3">
              {/* Meal header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white">{meal.name}</p>
                  <p className="text-xs text-[#909090] mt-0.5">{meal.time}</p>
                </div>
                <span className="text-sm font-semibold text-[#C9A84C]">{meal.calories} cal</span>
              </div>
              {/* Macro pills */}
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-semibold bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full">P: {meal.protein_g}g</span>
                <span className="text-[10px] font-semibold bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full">C: {meal.carbs_g}g</span>
                <span className="text-[10px] font-semibold bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full">F: {meal.fat_g}g</span>
              </div>
              {/* Foods */}
              <div className="mt-3 space-y-1">
                {meal.foods.map((food, j) => (
                  <p key={j} className="text-sm text-[#909090] flex items-start gap-2">
                    <span className="text-[#505050] mt-0.5 flex-shrink-0">·</span>
                    {food}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NOTES */}
        {pd.notes && (
          <div className="bg-[#161616] border border-[#C9A84C]/20 rounded-2xl p-4 mt-4">
            <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">Coach Notes</p>
            <p className="text-sm text-[#909090] leading-relaxed">{pd.notes}</p>
          </div>
        )}

      </div>
    </div>
  )
}
