import React from 'react'
import { Crown, ChevronRight } from 'lucide-react'
import type { GeneratedPlanData } from '../lib/plan-generator'

interface PlanReadyScreenProps {
  data: GeneratedPlanData
  userName: string
  onStart: () => void
}

export function PlanReadyScreen({ data, userName, onStart }: PlanReadyScreenProps) {
  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col px-5 pb-10">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/6 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Crown icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-[#C9A84C]" />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-3">
            Protocol Generated
          </p>
          <h1 className="text-3xl font-black text-[#F0F4FF] mb-2 leading-tight">
            Your Protocol<br />Is Ready{userName ? `, ${userName}` : ''}.
          </h1>
        </div>

        {/* Plan numbers */}
        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-4">
            Your Numbers
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Training Days', value: `${data.daysPerWeek}×/week`, color: '#F0F4FF' },
              { label: 'Daily Calories', value: `${data.calories} kcal`, color: '#F0F4FF' },
              { label: 'Daily Protein', value: `${data.proteinG}g`, color: '#C9A84C' },
              { label: 'Split', value: data.splitType, color: '#F0F4FF' },
            ].map(item => (
              <div key={item.label} className="bg-[#0D1117] rounded-xl p-3">
                <p className="text-xs text-[#445577] mb-1">{item.label}</p>
                <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        {data.trainingReasoning.length > 0 && (
          <div className="space-y-1.5 mb-6">
            {data.trainingReasoning.slice(0, 3).map((r, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[#C9A84C] text-xs mt-0.5 flex-shrink-0">→</span>
                <p className="text-xs text-[#8899BB] leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-black py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        Start Today <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
