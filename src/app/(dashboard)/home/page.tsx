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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const isNewUser = params.new === 'true'

  const [
    { data: profileData },
    { data: onboardingData },
    { data: recentCheckinsData },
    { data: intelligenceAlerts },
    { data: performanceScores },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('onboarding_data').select('*').eq('user_id', user.id).single(),
    supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
    supabase.from('intelligence_alerts').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('performance_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1).single(),
  ])

  const profile       = profileData      as UserProfile   | null
  const onboarding    = onboardingData   as OnboardingData | null
  const recentCheckins = (recentCheckinsData ?? []) as DailyCheckin[]
  const latest        = recentCheckins[0] ?? null

  // Baseline scores from check-in data (fallback if no performance_scores row yet)
  const avgEnergy = recentCheckins.length
    ? Math.round(recentCheckins.reduce((s, c) => s + (c.energy_level ?? 5), 0) / recentCheckins.length * 10)
    : 70
  const avgRecovery = recentCheckins.length
    ? Math.round((10 - (recentCheckins[0]?.soreness_level ?? 5)) * 10)
    : 65
  const adherenceScore = recentCheckins.length
    ? Math.round((recentCheckins.filter(c => c.adherence_workout).length / recentCheckins.length) * 100)
    : 0
  const readinessScore = Math.round((avgEnergy + avgRecovery) / 2)

  // Real performance scores with graceful fallback
  const scores = performanceScores ?? null
  const displayReadiness  = scores?.readiness_score  ?? readinessScore
  const displayRecovery   = scores?.recovery_score   ?? avgRecovery
  const displayAdherence  = scores?.adherence_score  ?? adherenceScore
  const displayMomentum   = scores?.momentum_score   ?? Math.round((avgEnergy + avgRecovery) / 2)
  const displayDiscipline = scores?.discipline_rating ?? 0

  const getReadiness = (score: number) => {
    if (score >= 80) return { label: 'Optimal',  color: '#22C55E', advice: 'Perfect day for high intensity training' }
    if (score >= 65) return { label: 'Good',     color: '#C9A84C', advice: 'Moderate intensity recommended' }
    if (score >= 50) return { label: 'Moderate', color: '#F97316', advice: 'Consider a lighter session today' }
    return             { label: 'Low',      color: '#EF4444', advice: 'Active recovery recommended today' }
  }

  const readiness  = getReadiness(displayReadiness)
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'King'
  const sorenessHigh = (latest?.soreness_level ?? 0) >= 7

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

      {/* Welcome banner — only on first arrival after onboarding (?new=true) */}
      {isNewUser && (
        <div className="px-4 pt-4">
          <div
            className="rounded-2xl border border-[var(--gold)]/40 p-5"
            style={{ background: 'rgba(201,168,76,0.07)' }}
          >
            <p className="text-base font-bold text-white mb-1">👑 Welcome! Your personalized plans are ready.</p>
            <p className="text-xs text-gray-400 mb-4">Your AI coach has built your workout and nutrition programs from scratch — tailored to you.</p>
            <div className="flex gap-3">
              <Link
                href="/workout"
                className="flex-1 text-center py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black text-sm font-bold transition-colors"
              >
                View Workout
              </Link>
              <Link
                href="/nutrition"
                className="flex-1 text-center py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black text-sm font-bold transition-colors"
              >
                View Nutrition
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-8 pb-32 pt-5">
        {/* AI Readiness Card */}
        <div
          className="bg-[var(--surface-2)] border rounded-3xl p-5 animate-slide-up mb-8"
          style={{ borderColor: readiness.color + '30' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">AI Readiness</p>
              <h2 className="text-3xl font-black" style={{ color: readiness.color }}>{readiness.label}</h2>
              <p className="text-base text-gray-400 mt-0.5">{readiness.advice}</p>
            </div>
            <ScoreRing score={displayReadiness} color="auto" size={72} strokeWidth={5} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Recovery',   score: displayRecovery  },
              { label: 'Adherence',  score: displayAdherence },
              { label: 'Momentum',   score: displayMomentum  },
              { label: 'Discipline', score: displayDiscipline },
            ].map(({ label, score }) => (
              <div key={label} className="bg-black/30 rounded-xl p-2 text-center">
                <p className="text-2xl font-bold text-white">{score}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-4 pt-4 px-4">Quick Actions</p>
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
                className="bg-[var(--surface-2)] border border-[var(--border)] hover:border-gray-700 rounded-2xl p-4 transition-all duration-200 active:scale-95 min-h-[100px] flex flex-col justify-between"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-base font-semibold text-white">{label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        {onboarding && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-4 pt-4 px-4">Your Metrics</p>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                label="Current Weight"
                value={latest?.weight_kg ?? onboarding.weight_kg ?? '--'}
                unit="kg"
                color="gold"
              />
              <StatCard label="Goal"          value={goalLabel}                        color="gold"   />
              <StatCard label="Training Days" value={onboarding.days_per_week ?? '--'} unit="/ week" color="green"  />
              <StatCard label="Experience"    value={expLabel}                         color="gold"  />
            </div>
          </div>
        )}

        {/* AI Intelligence Feed */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium pt-4 px-4">AI Intelligence</p>
            <div className="flex items-center gap-2">
              {intelligenceAlerts && intelligenceAlerts.length > 0 ? (
                <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 px-2 py-0.5 rounded-full">
                  {intelligenceAlerts.length} insight{intelligenceAlerts.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
                  <span className="text-xs text-[var(--gold)]">Live</span>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {intelligenceAlerts && intelligenceAlerts.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              intelligenceAlerts.map((alert: any) => (
                <AIFeedItem
                  key={alert.id}
                  message={alert.message}
                  type={
                    alert.severity === 'positive' ? 'success' :
                    alert.severity === 'critical' ? 'warning' :
                    alert.severity === 'warning'  ? 'warning' : 'info'
                  }
                />
              ))
            ) : (
              <>
                <AIFeedItem
                  message="Complete your daily check-in to activate AI pattern detection"
                  type="info"
                />
                <AIFeedItem
                  message="Your coaching agents are analyzing your performance data"
                  type="insight"
                />
              </>
            )}
          </div>
        </div>

        {/* Agent Team */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium pt-4 px-4">Your Coaching Team</p>
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
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 mb-2">
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
