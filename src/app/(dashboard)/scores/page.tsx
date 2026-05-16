import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ScoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scores } = await supabase
    .from('performance_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .limit(30)

  const latest = scores?.[0]

  const scoreCards = [
    {
      key: 'recovery_score',
      label: 'Recovery Score',
      icon: '🛌',
      description: 'How well your body is recovering between sessions',
      tip: 'Improve with 8+ hours sleep, active recovery, and deload weeks',
    },
    {
      key: 'training_readiness',
      label: 'Training Readiness',
      icon: '💪',
      description: "Your body's readiness for today's training session",
      tip: 'Peaks when energy is high, soreness is low, and sleep is good',
    },
    {
      key: 'adherence_score',
      label: 'Adherence Score',
      icon: '✅',
      description: "How consistently you're following your plan",
      tip: 'Track every workout and meal to improve this score',
    },
    {
      key: 'stress_load',
      label: 'Stress Load',
      icon: '⚡',
      description: 'Combined physical and mental stress on your system',
      tip: 'High stress impairs recovery and fat loss. Prioritize sleep and rest days',
    },
    {
      key: 'momentum_score',
      label: 'Momentum Score',
      icon: '🚀',
      description: 'Overall positive trend across all your metrics',
      tip: 'Builds when adherence, energy, and recovery all trend upward together',
    },
    {
      key: 'discipline_rating',
      label: 'Discipline Rating',
      icon: '🔥',
      description: 'Consistency and streak-based performance indicator',
      tip: 'Increases with check-in streaks and high weekly adherence',
    },
    {
      key: 'fat_loss_velocity',
      label: 'Fat Loss Velocity',
      icon: '📉',
      description: 'Rate of weight change per week',
      tip: 'Optimal fat loss is 0.5–1kg per week. Faster may cause muscle loss',
    },
    {
      key: 'recovery_risk',
      label: 'Recovery Risk',
      icon: '⚠️',
      description: 'Risk of overtraining or injury based on recent load',
      tip: 'High risk means take a rest day or deload immediately',
    },
  ]

  function getScoreColor(score: number): string {
    if (score >= 75) return '#22C55E'
    if (score >= 50) return '#C9A84C'
    if (score >= 25) return '#F97316'
    return '#EF4444'
  }

  function getScoreLabel(score: number): string {
    if (score >= 75) return 'Excellent'
    if (score >= 50) return 'Good'
    if (score >= 25) return 'Moderate'
    return 'Low'
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24">

        <div className="py-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#505050]">Performance</p>
          <h1 className="text-3xl font-black text-white mt-0.5">Your Scores</h1>
          <p className="text-sm text-[#909090] mt-1">
            {latest ? `Last updated: ${latest.score_date}` : 'Complete a check-in to generate scores'}
          </p>
        </div>

        <div style={{height: '24px'}} />

        {!latest ? (
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-base font-semibold text-white mb-2">No scores yet</p>
            <p className="text-sm text-[#909090]">Complete your daily check-in to generate your performance scores</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scoreCards.map(card => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawScore = (latest as any)[card.key] as number ?? 0

              if (card.key === 'fat_loss_velocity') {
                const fatColor = rawScore < 0 ? '#22C55E' : rawScore > 0 ? '#C9A84C' : '#909090'
                const fatDisplay = rawScore !== 0
                  ? `${rawScore < 0 ? '↓' : '↑'}${Math.abs(rawScore).toFixed(2)}`
                  : '—'
                return (
                  <div key={card.key} className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{card.icon}</span>
                        <div>
                          <p className="text-base font-semibold text-white">{card.label}</p>
                          <p className="text-xs text-[#505050]">{card.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black" style={{ color: fatColor }}>{fatDisplay}</p>
                        <p className="text-xs text-[#505050]">kg/week</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#505050] mt-1">💡 {card.tip}</p>
                  </div>
                )
              }

              const score = Math.round(rawScore)
              const color = card.key === 'recovery_risk'
                ? (score <= 30 ? '#22C55E' : score <= 60 ? '#C9A84C' : '#EF4444')
                : getScoreColor(score)
              const label = getScoreLabel(score)

              return (
                <div key={card.key} className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{card.icon}</span>
                      <div>
                        <p className="text-base font-semibold text-white">{card.label}</p>
                        <p className="text-xs text-[#505050]">{card.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color }}>{score}</p>
                      <p className="text-xs" style={{ color }}>{label}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-xs text-[#505050] mt-2">💡 {card.tip}</p>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
