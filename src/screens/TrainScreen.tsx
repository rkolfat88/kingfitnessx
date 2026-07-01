import React, { useEffect, useState } from 'react';
import { Dumbbell, ChevronDown, BarChart3, Clock, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TrainingPlan, TrainingDay, Verification } from '../lib/coaching-engine/types';

interface TrainScreenProps {
  onStartWorkout: (day: TrainingDay, planId: string | null) => void;
}

export default function TrainScreen({ onStartWorkout }: TrainScreenProps) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [showMath, setShowMath] = useState(false);

  useEffect(() => {
    if (user) loadPlan();
  }, [user]);

  const loadPlan = async () => {
    const { data } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setPlan(data.plan_data as TrainingPlan);
      setPlanId(data.id ?? null);
      setReasoning(data.plan_data?.reasoning || []);
      setVerifications(data.plan_data?.verifications || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Dumbbell className="w-8 h-8 text-[#C9A84C] animate-pulse" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-5 text-center">
        <Dumbbell className="w-10 h-10 text-[#445577] mb-4" />
        <h2 className="text-xl font-black text-[#F0F4FF] mb-2">No Plan Yet</h2>
        <p className="text-sm text-[#8899BB]">Complete onboarding to generate your training plan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] pb-24">
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-1">
          Your Program
        </p>
        <h1 className="text-3xl font-black text-[#F0F4FF] mb-1">
          {plan.split_type}
        </h1>
        <p className="text-sm text-[#8899BB]">
          Week {plan.mesocycle_week} · {plan.days_per_week} days/week
        </p>
      </div>

      <div className="px-5 space-y-4">

        <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-1">
            Program Notes
          </p>
          <p className="text-sm text-[#8899BB] leading-relaxed">{plan.notes}</p>
        </div>

        <button
          onClick={() => setShowMath(!showMath)}
          className="w-full bg-[#111827] border border-[#1E2D40] hover:border-[#C9A84C]/30 rounded-2xl p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-sm font-semibold text-[#F0F4FF]">Why this plan?</span>
            <span className="text-xs text-[#445577]">Show the math</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#445577] transition-transform ${showMath ? 'rotate-180' : ''}`} />
        </button>

        {showMath && (
          <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-4 space-y-2">
            {reasoning.map((r, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#C9A84C] text-xs mt-0.5">→</span>
                <p className="text-xs text-[#8899BB] leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        )}

        {verifications.length > 0 && (
          <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#111827] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-2">
              Confirm with your coach
            </p>
            {verifications.map((v, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="text-sm text-[#F0F4FF]">{v.message}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-3">
            Training Sessions
          </p>
          <div className="space-y-3">
            {plan.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#F0F4FF]">{day.day_name}</p>
                      <p className="text-xs text-[#8899BB]">{day.focus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#445577]" />
                      <span className="text-xs text-[#445577]">{day.duration_min}min</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#445577] transition-transform ${expandedDay === dayIndex ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandedDay === dayIndex && (
                  <div className="border-t border-[#1E2D40] px-4 pb-4 pt-3 space-y-2">
                    {day.exercises.map((ex, exIndex) => (
                      <div
                        key={exIndex}
                        className="bg-[#0D1117] rounded-xl p-3 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#F0F4FF]">{ex.name}</p>
                          {ex.notes && (
                            <p className="text-xs text-[#F97316] mt-0.5">{ex.notes}</p>
                          )}
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-sm font-black text-[#C9A84C]">
                            {ex.sets} × {ex.reps}
                          </p>
                          <p className="text-xs text-[#445577]">
                            RPE {ex.rpe} · {ex.rest_seconds}s rest
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl px-3 py-2 mt-3">
                      <p className="text-xs text-[#22C55E]">
                        ↑ Hit the top of the rep range? Add 2.5kg next week.
                      </p>
                    </div>

                    <button
                      onClick={() => onStartWorkout(day, planId)}
                      className="mt-3 w-full py-3 bg-[#C9A84C] hover:bg-[#E8C76A] text-[#070B14] font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Workout
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
