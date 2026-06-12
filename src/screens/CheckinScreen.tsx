import React, { useState, useEffect } from 'react';
import { Moon, Zap, Activity, ChevronRight, BarChart3, ChevronDown, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { checkinToDailyState, generateCounterfactual, calculateNewStreak, checkMilestone } from '../lib/checkin-engine';
import { adaptSession } from '../lib/coaching-engine/adapt';
import type { TrainingDay } from '../lib/coaching-engine/types';

export default function CheckinScreen() {
  const { user } = useAuth();
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMath, setShowMath] = useState(false);
  const [milestone, setMilestone] = useState<{ title: string; message: string } | null>(null);

  const [sleep, setSleep] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const { data: checkin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user!.id)
      .eq('checkin_date', today)
      .maybeSingle();

    if (checkin?.completed) {
      setAlreadyDone(true);
      setTodayCheckin(checkin);
    }

    const { data: streakData } = await supabase
      .from('protocol_streaks')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (streakData) setStreak(streakData.current_streak);

    const { data: plan } = await supabase
      .from('training_plans')
      .select('plan_data')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();

    if (plan) setTrainingPlan(plan.plan_data);

    setLoading(false);
  };

  const getTodaySession = (): TrainingDay | null => {
    if (!trainingPlan?.days?.length) return null;
    const dayOfWeek = new Date().getDay();
    const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return trainingPlan.days[index % trainingPlan.days.length] || trainingPlan.days[0];
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const state = checkinToDailyState(sleep, energy, soreness);
    const todaySession = getTodaySession();

    let adaptedSession = null;
    let reasoning: string[] = [];
    let flags: string[] = [];
    let counterfactual: string | null = null;

    if (todaySession) {
      const output = adaptSession(todaySession, state, '');
      adaptedSession = output.result;
      reasoning = output.reasoning;
      flags = output.flags;
      counterfactual = generateCounterfactual(todaySession, state);
    }

    const { error: cErr } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        checkin_date: today,
        sleep_quality: sleep,
        energy,
        soreness,
        notes: notes || null,
        adapted_session: adaptedSession,
        adaptation_reasoning: reasoning,
        adaptation_flags: flags,
        counterfactual,
        completed: true,
      }, { onConflict: 'user_id,checkin_date' });

    if (cErr) console.error('Checkin save error:', cErr);

    const { data: streakData } = await supabase
      .from('protocol_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { newStreak } = calculateNewStreak(
      streakData?.current_streak || 0,
      streakData?.last_checkin_date || null,
      today
    );

    const m = checkMilestone(newStreak);
    if (m) setMilestone(m);

    await supabase
      .from('protocol_streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streakData?.longest_streak || 0),
        last_checkin_date: today,
        total_days_on_protocol: (streakData?.total_days_on_protocol || 0) + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    setStreak(newStreak);
    setTodayCheckin({
      sleep_quality: sleep,
      energy,
      soreness,
      adapted_session: adaptedSession,
      adaptation_reasoning: reasoning,
      adaptation_flags: flags,
      counterfactual,
    });
    setAlreadyDone(true);
    setSaving(false);
  };

  const Scale = ({
    icon: Icon,
    label,
    value,
    onChange,
    color,
    lowLabel,
    highLabel,
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
    lowLabel: string;
    highLabel: string;
  }) => (
    <div className="bg-[#111827] border border-[#1E2D40] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-semibold text-[#F0F4FF]">{label}</span>
      </div>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 py-3 rounded-xl border text-sm font-black transition-all"
            style={{
              backgroundColor: value === v ? `${color}20` : '#0D1117',
              borderColor: value === v ? `${color}80` : '#1E2D40',
              color: value === v ? color : '#445577',
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-[#445577]">{lowLabel}</span>
        <span className="text-xs text-[#445577]">{highLabel}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Activity className="w-8 h-8 text-[#C9A84C] animate-pulse" />
      </div>
    );
  }

  if (alreadyDone && todayCheckin) {
    const flags = todayCheckin.adaptation_flags || [];
    const reasoning = todayCheckin.adaptation_reasoning || [];
    const adapted = todayCheckin.adapted_session;
    const isFloor = flags.includes('floor_mode');
    const isPeak = flags.includes('peak_state');

    return (
      <div className="min-h-screen bg-[#070B14] pb-24">
        <div className="px-5 pt-12 pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-1">
            Today's Readiness
          </p>
          <h1 className="text-3xl font-black text-[#F0F4FF] mb-1">
            Check-in Complete
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Flame className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-sm font-bold text-[#C9A84C]">
              {streak} day{streak !== 1 ? 's' : ''} on protocol
            </span>
          </div>
        </div>

        {milestone && (
          <div className="mx-5 mb-4 bg-[#C9A84C]/10 border border-[#C9A84C]/40 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">👑</div>
            <p className="text-base font-black text-[#C9A84C] mb-1">{milestone.title}</p>
            <p className="text-sm text-[#8899BB] leading-relaxed">{milestone.message}</p>
          </div>
        )}

        <div className="px-5 space-y-4">

          <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-3">
              Readiness Signal
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sleep', value: todayCheckin.sleep_quality, color: '#3B82F6', icon: Moon },
                { label: 'Energy', value: todayCheckin.energy, color: '#22C55E', icon: Zap },
                { label: 'Soreness', value: todayCheckin.soreness, color: '#F97316', icon: Activity },
              ].map(item => (
                <div key={item.label} className="bg-[#0D1117] rounded-xl p-3 text-center">
                  <item.icon className="w-4 h-4 mx-auto mb-1" style={{ color: item.color }} />
                  <p className="text-xl font-black" style={{ color: item.color }}>
                    {item.value}/5
                  </p>
                  <p className="text-xs text-[#445577]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {adapted && (
            <div className={`bg-[#111827] border rounded-2xl p-5 ${
              isFloor ? 'border-[#EF4444]/30' :
              isPeak ? 'border-[#22C55E]/30' :
              'border-[#C9A84C]/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB]">
                  Today's Session
                </p>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  isFloor ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                  isPeak ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                  'bg-[#C9A84C]/10 text-[#C9A84C]'
                }`}>
                  {isFloor ? 'Floor Mode' : isPeak ? 'Peak State' : 'Adapted'}
                </span>
              </div>
              <h3 className="text-lg font-black text-[#F0F4FF] mb-1">{adapted.focus}</h3>
              <p className="text-sm text-[#8899BB] mb-4">{adapted.duration_min} min · {adapted.exercises?.length} exercises</p>

              {adapted.exercises?.slice(0, 3).map((ex: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E2D40] last:border-0">
                  <span className="text-sm text-[#F0F4FF]">{ex.name}</span>
                  <span className="text-sm font-bold text-[#C9A84C]">{ex.sets}×{ex.reps}</span>
                </div>
              ))}

              <button
                onClick={() => setShowMath(!showMath)}
                className="w-full mt-4 flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-xs font-semibold text-[#C9A84C]">
                    Why was today adapted?
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#445577] transition-transform ${showMath ? 'rotate-180' : ''}`} />
              </button>

              {showMath && (
                <div className="mt-3 space-y-1">
                  {reasoning.map((r: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-[#C9A84C] text-xs">→</span>
                      <p className="text-xs text-[#8899BB] leading-relaxed">{r}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {todayCheckin.counterfactual && (
            <div className="bg-[#0D1117] border border-[#1E2D40] rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#445577] mb-2">
                Without today's check-in
              </p>
              <p className="text-xs text-[#8899BB] leading-relaxed italic">
                {todayCheckin.counterfactual}
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] pb-32">
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">
            {streak > 0 ? `${streak} day streak` : 'Day 1'}
          </span>
        </div>
        <h1 className="text-3xl font-black text-[#F0F4FF] mb-1">
          Readiness Signal
        </h1>
        <p className="text-sm text-[#8899BB]">
          15 seconds. Honest answers change today's plan.
        </p>
      </div>

      <div className="px-5 space-y-3">

        <Scale
          icon={Moon}
          label="Sleep quality last night"
          value={sleep}
          onChange={setSleep}
          color="#3B82F6"
          lowLabel="Terrible"
          highLabel="Perfect"
        />

        <Scale
          icon={Zap}
          label="Energy right now"
          value={energy}
          onChange={setEnergy}
          color="#22C55E"
          lowLabel="Depleted"
          highLabel="Locked in"
        />

        <Scale
          icon={Activity}
          label="Muscle soreness"
          value={soreness}
          onChange={setSoreness}
          color="#F97316"
          lowLabel="Wrecked"
          highLabel="Fresh"
        />

        <div className="bg-[#111827] border border-[#1E2D40] rounded-2xl p-4">
          <p className="text-xs text-[#445577] mb-2">
            Anything the coach should know? (optional)
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. knee felt off yesterday, bad sleep week, stressed at work..."
            rows={2}
            className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-xl px-3 py-2 text-sm text-[#F0F4FF] placeholder:text-[#445577] focus:border-[#C9A84C]/50 focus:outline-none resize-none"
          />
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#070B14]/95 backdrop-blur border-t border-[#1E2D40] px-5 py-4 z-50">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] disabled:opacity-40 text-black font-black py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <span>Reading your signals...</span>
          ) : (
            <>
              <span>Get Today's Plan</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-xs text-[#445577] text-center mt-2">
          Every check-in is a vote for your protocol
        </p>
      </div>
    </div>
  );
}
