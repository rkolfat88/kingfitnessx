import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Crown, Zap, Moon, Dumbbell, Apple,
  TrendingUp, MessageSquare, Activity, Flame, ChevronRight,
} from 'lucide-react'
import { ScoreRing } from '@/components/ui/score-ring'
import { AIFeedItem } from '@/components/dashboard/ai-feed-item'
import { AgentCard } from '@/components/dashboard/agent-card'
import { StatCard } from '@/components/ui/stat-card'
import Link from 'next/link'
import type { UserProfile, OnboardingData, DailyCheckin } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profileData }, { data: onboardingData }, { data: recentCheckinsData }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('onboarding_data').select('*').eq('user_id', user.id).single(),
    supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
  ])

  const profile   = profileData  as UserProfile   | null
  const onboarding = onboardingData as OnboardingData | null
  const recentCheckins = (recentCheckinsData ?? []) as DailyCheckin[]
  const latest = recentCheckins[0] ?? null

  // Score calculations (0–100)
  const avgEnergy   = recentCheckins.length
    ? Math.round(recentCheckins.reduce((s, c) => s + (c.energy_level ?? 5), 0) / recentCheckins.length * 10)
    : 70
  const avgRecovery = recentCheckins.length
    ? Math.round((10 - (recentCheckins[0]?.soreness_level ?? 5)) * 10)
    : 65
  const adherenceScore = recentCheckins.length
    ? Math.round((recentCheckins.filter(c => c.adherence_workout).length / recentCheckins.length) * 100)
    : 0
  const readinessScore = Math.round((avgEnergy + avgRecovery) / 2)

  const getReadiness = (score: number) => {
    if (score >= 80) return { label: 'Optimal',  color: '#22C55E', advice: 'Perfect day for high intensity training' }
    if (score >= 65) return { label: 'Good',     color: '#C9A84C', advice: 'Moderate intensity recommended' }
    if (score >= 50) return { label: 'Moderate', color: '#F97316', advice: 'Consider a lighter session today' }
    return             { label: 'Low',      color: '#EF4444', advice: 'Active recovery recommended today' }
  }

  const readiness  = getReadiness(readinessScore)
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'King'
  const sorenessHigh = (latest?.soreness_level ?? 0) >= 7

  const feedMessages: Array<{ message: string; type: 'info' | 'success' | 'warning' | 'insight' }> = []
  if (latest) {
    if (latest.energy_level >= 8)         feedMessages.push({ message: 'High energy detected — optimal for strength training', type: 'success' })
    if (sorenessHigh)                     feedMessages.push({ message: 'High soreness detected — recovery protocol activated', type: 'warning' })
    if (latest.adherence_workout)         feedMessages.push({ message: 'Workout logged — progressive overload on track',       type: 'success' })
    if (!latest.adherence_nutrition)      feedMessages.push({ message: 'Nutrition tracking missed — consistency drives results', type: 'warning' })
    if (latest.mood >= 8)                 feedMessages.push({ message: 'Positive mindset — use this momentum today',          type: 'insight' })
  }
  if (feedMessages.length === 0) {
    feedMessages.push({ message: 'Complete your daily check-in for personalized AI insights', type: 'info' })
    feedMessages.push({ message: 'Your specialist agents are ready — ask anything',            type: 'insight' })
  }

  const goalLabel = onboarding?.goal
    ? onboarding.goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : '--'
  const expLabel = onboarding?.training_experience
    ? onboarding.training_experience.replace(/\b\w/g, l => l.toUpperCase())
    : '--'

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-white">{firstName} 👑</h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.subscription_tier === 'pro' && (
              <div className="flex items-center gap-1.5 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-full px-3 py-1">
                <Crown className="w-3 h-3 text-[var(--gold)]" />
                <span className="text-xs text-[var(--gold)] font-semibold">Pro</span>
              </div>
            )}
            <Link
              href="/settings"
              className="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"
            >
              <span className="text-xs font-bold text-[var(--gold)]">
                {firstName[0]?.toUpperCase() ?? 'K'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-6">
        {/* AI Readiness Card */}
        <div
          className="bg-[var(--surface-2)] border rounded-3xl p-5 animate-slide-up"
          style={{ borderColor: readiness.color + '30' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">AI Readiness</p>
              <h2 className="text-xl font-bold" style={{ color: readiness.color }}>{readiness.label}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{readiness.advice}</p>
            </div>
            <ScoreRing score={readinessScore} color="auto" size={72} strokeWidth={5} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Energy',    score: avgEnergy },
              { label: 'Recovery', score: avgRecovery },
              { label: 'Adherence', score: adherenceScore },
            ].map(({ label, score }) => (
              <div key={label} className="bg-black/30 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-white">{score}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: '/chat',      icon: MessageSquare, label: 'Talk to Coach',  color: '#C9A84C', desc: 'Get instant guidance'  },
              { href: '/check-in',  icon: Activity,      label: 'Daily Check-In', color: '#22C55E', desc: 'Log your metrics'      },
              { href: '/workout',   icon: Dumbbell,      label: 'View Workout',   color: '#3B82F6', desc: "Today's training"      },
              { href: '/nutrition', icon: Apple,         label: 'Nutrition Plan', color: '#F97316', desc: 'Meals & macros'        },
            ].map(({ href, icon: Icon, label, color, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-[var(--surface-2)] border border-[var(--border)] hover:border-gray-700 rounded-2xl p-4 transition-all duration-200 active:scale-95"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        {onboarding && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Your Metrics</p>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                label="Current Weight"
                value={latest?.weight_kg ?? onboarding.weight_kg ?? '--'}
                unit="kg"
                color="gold"
              />
              <StatCard label="Goal"          value={goalLabel}                       color="blue"   />
              <StatCard label="Training Days" value={onboarding.days_per_week ?? '--'} unit="/ week" color="green"  />
              <StatCard label="Experience"    value={expLabel}                        color="orange" />
            </div>
          </div>
        )}

        {/* AI Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">AI Intelligence Feed</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
              <span className="text-xs text-[var(--gold)]">Live</span>
            </div>
          </div>
          <div className="space-y-2">
            {feedMessages.map((item, i) => (
              <AIFeedItem key={i} message={item.message} type={item.type} />
            ))}
          </div>
        </div>

        {/* Agent Team */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your Coaching Team</p>
            <Link href="/chat" className="text-xs text-[var(--gold)] flex items-center gap-1">
              Talk to them <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            <AgentCard
              name="Workout Agent"
              role="Strength & Conditioning"
              icon={Dumbbell}
              status="active"
              lastAction="Training plan ready for today"
              color="#3B82F6"
            />
            <AgentCard
              name="Dr. King — Nutritionist"
              role="Clinical Nutrition & Carnivore"
              icon={Apple}
              status="active"
              lastAction="Personalized meal plan generated"
              color="#F97316"
            />
            <AgentCard
              name="Recovery Specialist"
              role="Fatigue & Adaptation"
              icon={Moon}
              status={sorenessHigh ? 'alert' : 'standby'}
              lastAction={sorenessHigh ? 'High soreness — check recovery protocol' : 'Monitoring recovery metrics'}
              color="#22C55E"
            />
            <AgentCard
              name="Supplement Engineer"
              role="Evidence-Based Supplementation"
              icon={Zap}
              status="standby"
              lastAction="Ask me about your optimal stack"
              color="#C9A84C"
            />
          </div>
        </div>

        {/* Discipline Streak */}
        {recentCheckins.length > 0 && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Discipline Score</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{recentCheckins.length}</span>
                  <span className="text-gray-500 text-sm">day streak</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-lg ${i < recentCheckins.length ? 'bg-[var(--gold)]/20 border border-[var(--gold)]/40' : 'bg-[var(--surface-3)] border border-[var(--border)]'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Banner */}
        {profile?.subscription_tier !== 'pro' && (
          <Link
            href="/upgrade"
            className="block bg-gradient-to-r from-[var(--gold)]/10 to-[var(--gold-dark)]/10 border border-[var(--gold)]/30 rounded-2xl p-5 animate-pulse-gold"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-[var(--gold)] font-semibold text-sm">Unlock King Pro</span>
                </div>
                <p className="text-gray-400 text-xs">Unlimited coaching · All agents · Full plan generation</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">$19</p>
                <p className="text-gray-500 text-xs">/month</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
