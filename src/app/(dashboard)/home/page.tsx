import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Crown, Zap, Moon, Dumbbell, Apple,
  MessageSquare, Activity, Flame, ChevronRight,
} from 'lucide-react'
import { ScoreRing } from '@/components/ui/score-ring'
import { AIFeedItem } from '@/components/dashboard/ai-feed-item'
import { AgentCard } from '@/components/dashboard/agent-card'
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

  const profile        = profileData      as UserProfile   | null
  const onboarding     = onboardingData   as OnboardingData | null
  const recentCheckins = (recentCheckinsData ?? []) as DailyCheckin[]
  const latest         = recentCheckins[0] ?? null

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

  const scores            = performanceScores ?? null
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

  const readiness    = getReadiness(displayReadiness)
  const hour         = new Date().getHours()
  const greeting     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName    = profile?.full_name?.split(' ')[0] ?? 'King'
  const sorenessHigh = (latest?.soreness_level ?? 0) >= 7

  const goalLabel = onboarding?.goal
    ? onboarding.goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : '--'
  const expLabel = onboarding?.training_experience
    ? onboarding.training_experience.replace(/\b\w/g, l => l.toUpperCase())
    : '--'

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 pt-14 pb-24 space-y-8">

        {/* GREETING */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-[#909090] text-sm">{greeting},</p>
            <h1 className="text-3xl font-black text-white mt-0.5">{firstName} 👑</h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.subscription_tier === 'pro' && (
              <div className="flex items-center gap-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full px-3 py-1">
                <Crown className="w-3 h-3 text-[#C9A84C]" />
                <span className="text-xs text-[#C9A84C] font-semibold">Pro</span>
              </div>
            )}
            <Link
              href="/settings"
              className="w-9 h-9 rounded-full bg-[#161616] border border-[#242424] flex items-center justify-center"
            >
              <span className="text-xs font-bold text-[#C9A84C]">
                {firstName[0]?.toUpperCase() ?? 'K'}
              </span>
            </Link>
          </div>
        </div>

        {/* Welcome banner */}
        {isNewUser && (
          <div className="rounded-2xl border border-[#C9A84C]/40 p-4" style={{ background: 'rgba(201,168,76,0.07)' }}>
            <p className="text-sm font-bold text-white mb-1">👑 Welcome! Your personalized plans are ready.</p>
            <p className="text-xs text-[#909090] mb-3">Your AI coach has built your workout and nutrition programs from scratch — tailored to you.</p>
            <div className="flex gap-2">
              <Link href="/workout" className="flex-1 text-center py-2 rounded-xl bg-[#C9A84C] text-black text-sm font-bold">View Workout</Link>
              <Link href="/nutrition" className="flex-1 text-center py-2 rounded-xl bg-[#C9A84C] text-black text-sm font-bold">View Nutrition</Link>
            </div>
          </div>
        )}

        {/* AI READINESS CARD */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">AI Readiness</p>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black" style={{ color: readiness.color }}>{readiness.label}</h2>
              <p className="text-sm text-[#909090] mt-1">{readiness.advice}</p>
            </div>
            <ScoreRing score={displayReadiness} color="auto" size={72} strokeWidth={5} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: 'Recovery',   score: displayRecovery   },
              { label: 'Adherence',  score: displayAdherence  },
              { label: 'Momentum',   score: displayMomentum   },
              { label: 'Discipline', score: displayDiscipline },
            ].map(({ label, score }) => (
              <div key={label} className="bg-black/40 rounded-xl p-2 text-center">
                <p className="text-2xl font-bold text-white">{score}</p>
                <p className="text-[10px] text-[#505050] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/chat',      icon: MessageSquare, label: 'Talk to Coach',  color: '#C9A84C', desc: 'Get instant guidance'  },
              { href: '/check-in',  icon: Activity,      label: 'Daily Check-In', color: '#22C55E', desc: 'Log your metrics'      },
              { href: '/workout',   icon: Dumbbell,      label: 'View Workout',   color: '#3B82F6', desc: "Today's training"      },
              { href: '/nutrition', icon: Apple,         label: 'Nutrition Plan', color: '#F97316', desc: 'Meals & macros'        },
            ].map(({ href, icon: Icon, label, color, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-[#161616] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{label}</p>
                  <p className="text-xs text-[#909090] mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* YOUR METRICS */}
        {onboarding && (
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-4">Your Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Weight</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{latest?.weight_kg ?? onboarding.weight_kg ?? '--'}</span>
                  <span className="text-sm text-[#909090]">kg</span>
                </div>
              </div>
              <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Goal</p>
                <p className="text-2xl font-bold text-white leading-tight">{goalLabel}</p>
              </div>
              <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Training Days</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{onboarding.days_per_week ?? '--'}</span>
                  <span className="text-sm text-[#909090]">/ week</span>
                </div>
              </div>
              <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <p className="text-xs text-[#505050] uppercase tracking-wide mb-1">Experience</p>
                <p className="text-2xl font-bold text-white leading-tight">{expLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE FEED */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#505050]">AI Intelligence</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-xs text-[#C9A84C]">Live</span>
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
                <AIFeedItem message="Complete your daily check-in to activate AI pattern detection" type="info" />
                <AIFeedItem message="Your coaching agents are analyzing your performance data" type="insight" />
              </>
            )}
          </div>
        </div>

        {/* COACHING TEAM */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#505050]">Coaching Team</p>
            <Link href="/chat" className="text-xs text-[#C9A84C] flex items-center gap-1">
              Talk to them <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            <AgentCard name="Workout Agent" role="Strength & Conditioning" icon={Dumbbell} status="active" lastAction="Training plan ready for today" color="#3B82F6" />
            <AgentCard name="Dr. King — Nutritionist" role="Clinical Nutrition & Carnivore" icon={Apple} status="active" lastAction="Personalized meal plan generated" color="#F97316" />
            <AgentCard name="Recovery Specialist" role="Fatigue & Adaptation" icon={Moon} status={sorenessHigh ? 'alert' : 'standby'} lastAction={sorenessHigh ? 'High soreness — check recovery protocol' : 'Monitoring recovery metrics'} color="#22C55E" />
            <AgentCard name="Supplement Engineer" role="Evidence-Based Supplementation" icon={Zap} status="standby" lastAction="Ask me about your optimal stack" color="#C9A84C" />
          </div>
        </div>

        {/* DISCIPLINE STREAK */}
        {recentCheckins.length > 0 && (
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#505050] mb-1">Discipline Score</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{recentCheckins.length}</span>
                  <span className="text-[#909090] text-sm">day streak</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-lg ${i < recentCheckins.length ? 'bg-[#C9A84C]/20 border border-[#C9A84C]/40' : 'bg-[#1a1a1a] border border-[#242424]'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UPGRADE BANNER */}
        {profile?.subscription_tier !== 'pro' && (
          <Link
            href="/upgrade"
            className="block bg-gradient-to-r from-[#C9A84C]/10 to-[#9B7A2E]/10 border border-[#C9A84C]/30 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-[#C9A84C] font-semibold text-sm">Unlock King Pro</span>
                </div>
                <p className="text-[#909090] text-xs">Unlimited coaching · All agents · Full plan generation</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">$19</p>
                <p className="text-[#505050] text-xs">/month</p>
              </div>
            </div>
          </Link>
        )}

      </div>
    </div>
  )
}
