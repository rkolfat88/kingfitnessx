import React, { useState, useEffect, useCallback } from 'react'
import { Flame, ChevronRight, Activity, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { HeaderBar } from '../components/HeaderBar'
import type { TrainingDay } from '../lib/coaching-engine/types'
import { getLocalDateString } from '../lib/date'

interface TodayScreenProps {
  onNavigateToCheckin: () => void
  onNavigateToTrain: () => void
  onAvatarPress: () => void
  userInitials: string
}

export default function TodayScreen({ onNavigateToCheckin, onNavigateToTrain, onAvatarPress, userInitials }: TodayScreenProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const [checkinDone, setCheckinDone] = useState(false)
  const [checkinTime, setCheckinTime] = useState<string | null>(null)
  const [adaptedSession, setAdaptedSession] = useState<any>(null)
  const [adaptationReasoning, setAdaptationReasoning] = useState<string[]>([])
  const [adaptationFlags, setAdaptationFlags] = useState<string[]>([])
  const [rawSession, setRawSession] = useState<TrainingDay | null>(null)
  const [calories, setCalories] = useState<number | null>(null)
  const [proteinG, setProteinG] = useState<number | null>(null)
  const [carbsG, setCarbsG] = useState<number | null>(null)
  const [fatG, setFatG] = useState<number | null>(null)

  const today = getLocalDateString()

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [streakRes, checkinRes, planRes, nutritionRes] = await Promise.all([
        supabase.from('protocol_streaks').select('current_streak,total_days_on_protocol').eq('user_id', user.id).maybeSingle(),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', today).maybeSingle(),
        supabase.from('training_plans').select('id,plan_data').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
        supabase.from('nutrition_plans').select('daily_calories,protein_g,carbs_g,fat_g').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
      ])

      if (streakRes.data) {
        setStreak(streakRes.data.current_streak || 0)
        setTotalDays(streakRes.data.total_days_on_protocol || 0)
      }

      if (checkinRes.data?.completed) {
        setCheckinDone(true)
        setAdaptedSession(checkinRes.data.adapted_session)
        setAdaptationReasoning(checkinRes.data.adaptation_reasoning || [])
        setAdaptationFlags(checkinRes.data.adaptation_flags || [])
        // Extract time from updated_at or use checkin_date
        const updatedAt = checkinRes.data.updated_at
        if (updatedAt) {
          setCheckinTime(new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
      }

      if (planRes.data?.plan_data?.days?.length) {
        const dayOfWeek = new Date().getDay()
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const days = planRes.data.plan_data.days
        setRawSession(days[index % days.length] || days[0])
      }

      if (nutritionRes.data) {
        setCalories(nutritionRes.data.daily_calories)
        setProteinG(nutritionRes.data.protein_g)
        setCarbsG(nutritionRes.data.carbs_g)
        setFatG(nutritionRes.data.fat_g)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user, today])

  useEffect(() => { loadData() }, [loadData])

  const getCoachLine = (): string => {
    if (!checkinDone) return 'Complete your check-in — the system is waiting for your signal.'
    const isFloor = adaptationFlags.includes('floor_mode')
    const isPeak = adaptationFlags.includes('peak_state')
    if (isFloor) return 'Floor mode is still showing up. That is what separates you from everyone who quit.'
    if (isPeak) return 'Peak state. Make this session count — you earned it.'
    return 'Adapted and ready. The system read your signals. Trust the work.'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000]">
        <HeaderBar onAvatarPress={onAvatarPress} userInitials={userInitials} />
        <div className="px-5 space-y-4 mt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0D0D0D] rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000]">
        <HeaderBar onAvatarPress={onAvatarPress} userInitials={userInitials} />
        <div className="px-5 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p className="text-[#A0A0A0] text-sm mb-4">Couldn't load your plan.</p>
          <button
            onClick={loadData}
            className="text-[#CAFF40] font-semibold text-sm border border-[#CAFF40]/30 rounded-xl px-5 py-2.5"
          >
            Tap to retry
          </button>
        </div>
      </div>
    )
  }

  // No plan and no checkin data — user just finished onboarding or has no data yet
  if (!calories && !rawSession && !checkinDone) {
    return (
      <div className="min-h-screen bg-[#000000]">
        <HeaderBar onAvatarPress={onAvatarPress} userInitials={userInitials} />
        <div className="px-5 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p className="text-3xl font-black text-[#FFFFFF] mb-2">Your plan is ready.</p>
          <p className="text-sm text-[#A0A0A0] mb-6 leading-relaxed">
            Complete your first check-in to unlock today's adapted session.
          </p>
          <button
            onClick={onNavigateToCheckin}
            className="bg-[#CAFF40] text-black font-black py-4 px-8 rounded-2xl text-base flex items-center gap-2"
          >
            Start Check-in <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  const isFloor = adaptationFlags.includes('floor_mode')
  const isPeak = adaptationFlags.includes('peak_state')
  const sessionToShow = checkinDone ? adaptedSession : rawSession
  const adaptationBadge = isFloor ? 'Floor Mode' : isPeak ? 'Peak State' : checkinDone ? 'Adapted' : null
  const badgeColor = isFloor ? '#EF4444' : isPeak ? '#22C55E' : '#CAFF40'

  return (
    <div className="min-h-screen bg-[#000000] pb-28">
      <HeaderBar onAvatarPress={onAvatarPress} userInitials={userInitials} />

      <div className="px-5 space-y-3">

        {/* 1 — STREAK STRIP */}
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#CAFF40] flex-shrink-0" />
          <span className="text-sm font-bold text-[#CAFF40]">
            {streak > 0 ? `${streak}-day streak` : 'Day 1'}
          </span>
          {totalDays > 0 && (
            <span className="text-xs text-[#5C5C5C] ml-1">· Day {totalDays} on protocol</span>
          )}
        </div>

        {/* 2 — CHECK-IN CARD */}
        {checkinDone ? (
          <div className="bg-[#0D0D0D] border border-[#22C55E]/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#22C55E]">
              Check-in complete{checkinTime ? ` · ${checkinTime}` : ''}
            </span>
          </div>
        ) : (
          <button
            onClick={onNavigateToCheckin}
            className="w-full bg-[#0D0D0D] border border-[#CAFF40]/25 hover:border-[#CAFF40]/50 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#CAFF40]/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-[#CAFF40]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#FFFFFF]">Complete today's check-in</p>
                <p className="text-xs text-[#5C5C5C]">15 seconds · updates your session</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#5C5C5C]" />
          </button>
        )}

        {/* 3 — TODAY'S TRAINING BLOCK */}
        {sessionToShow && (
          <button
            onClick={onNavigateToTrain}
            className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#CAFF40]/30 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">
                Today's Session
              </p>
              {adaptationBadge && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: `${badgeColor}15`, color: badgeColor }}
                >
                  {adaptationBadge}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-[#FFFFFF] mb-0.5">{sessionToShow.focus}</h2>
            <p className="text-sm text-[#A0A0A0] mb-3">
              {sessionToShow.duration_min} min · {sessionToShow.exercises?.length || 0} exercises
            </p>
            {sessionToShow.exercises?.slice(0, 3).map((ex: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#262626] last:border-0">
                <span className="text-sm text-[#FFFFFF]">{ex.name}</span>
                <span className="text-sm font-bold text-[#CAFF40]">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
            {checkinDone && adaptationReasoning[0] && (
              <div className="mt-3 flex gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[#CAFF40] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#A0A0A0] leading-relaxed">{adaptationReasoning[0]}</p>
              </div>
            )}
            {!checkinDone && (
              <p className="text-xs text-[#5C5C5C] mt-3 italic">Check in to get your adapted version</p>
            )}
          </button>
        )}

        {/* 4 — MACRO PILLS */}
        {(calories || proteinG) && (
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-3">Today's Targets</p>
            <div className="flex gap-2">
              {[
                { label: 'Calories', value: calories, unit: 'kcal', color: '#FFFFFF' },
                { label: 'Protein', value: proteinG, unit: 'g', color: '#CAFF40' },
                { label: 'Carbs', value: carbsG, unit: 'g', color: '#3B82F6' },
                { label: 'Fat', value: fatG, unit: 'g', color: '#F97316' },
              ].map(item => item.value != null && (
                <div key={item.label} className="flex-1 bg-[#0D0D0D] rounded-xl px-2 py-2.5 text-center">
                  <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[9px] text-[#5C5C5C] uppercase tracking-wider mt-0.5">{item.unit === 'kcal' ? 'cal' : `${item.unit} ${item.label}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5 — COACH RICHARD K. LINE */}
        <div className="border-l-2 border-[#CAFF40] pl-4 py-1">
          <p className="text-sm text-[#FFFFFF] leading-relaxed italic">{getCoachLine()}</p>
          <p className="text-xs text-[#5C5C5C] mt-1 font-semibold">— Coach Richard K.</p>
        </div>

      </div>
    </div>
  )
}
