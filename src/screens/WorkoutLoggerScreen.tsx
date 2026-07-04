import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Timer, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TrainingDay } from '../lib/coaching-engine/types';

interface SetLog {
  weight_kg: string;
  reps_completed: string;
  completed: boolean;
}

interface ExerciseLog {
  index: number;
  sets: SetLog[];
  expanded: boolean;
}

interface WorkoutLoggerScreenProps {
  trainingDay: TrainingDay;
  planId: string | null;
  onFinish: () => void;
}

export default function WorkoutLoggerScreen({ trainingDay, planId, onFinish }: WorkoutLoggerScreenProps) {
  const { user } = useAuth();

  const [logs, setLogs] = useState<ExerciseLog[]>(() =>
    trainingDay.exercises.map((ex, i) => ({
      index: i,
      expanded: i === 0,
      sets: Array.from({ length: ex.sets }, () => ({
        weight_kg: '',
        reps_completed: '',
        completed: false,
      })),
    }))
  );

  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer === 0) setRestTimer(null);
      return;
    }
    const id = setTimeout(() => setRestTimer(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [restTimer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: 'weight_kg' | 'reps_completed',
    value: string
  ) => {
    setLogs(prev =>
      prev.map((log, i) =>
        i !== exIdx
          ? log
          : {
              ...log,
              sets: log.sets.map((s, j) =>
                j !== setIdx ? s : { ...s, [field]: value }
              ),
            }
      )
    );
  };

  const markSetComplete = (exIdx: number, setIdx: number) => {
    setLogs(prev =>
      prev.map((log, i) => {
        if (i !== exIdx) return log;
        const wasCompleted = log.sets[setIdx].completed;
        const updated = {
          ...log,
          sets: log.sets.map((s, j) =>
            j !== setIdx ? s : { ...s, completed: !s.completed }
          ),
        };
        if (!wasCompleted) {
          setRestTimer(trainingDay.exercises[exIdx].rest_seconds);
        }
        return updated;
      })
    );
  };

  const toggleExpand = (exIdx: number) => {
    setLogs(prev =>
      prev.map((log, i) => (i !== exIdx ? log : { ...log, expanded: !log.expanded }))
    );
  };

  const finishWorkout = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(false);

    const exercises_logged = logs.map((log, i) => {
      const ex = trainingDay.exercises[i];
      return {
        name: ex.name,
        planned_sets: ex.sets,
        planned_reps: ex.reps,
        planned_rpe: ex.rpe,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        sets: log.sets.map((s, j) => ({
          set_number: j + 1,
          weight_kg: s.weight_kg !== '' ? parseFloat(s.weight_kg) : null,
          reps_completed: s.reps_completed !== '' ? parseInt(s.reps_completed, 10) : null,
          completed: s.completed,
        })),
      };
    });

    const { error } = await supabase.from('workout_logs').insert({
      user_id: user.id,
      training_plan_id: planId,
      exercises_logged: {
        day_name: trainingDay.day_name,
        day_focus: trainingDay.focus,
        duration_planned_min: trainingDay.duration_min,
        exercises: exercises_logged,
      },
    });

    if (error) {
      console.error('Workout log save error:', error);
      setSaveError(true);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(onFinish, 900);
  };

  const totalSets = logs.reduce((sum, log) => sum + log.sets.length, 0);
  const doneSets = logs.reduce((sum, log) => sum + log.sets.filter(s => s.completed).length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <div className="min-h-screen bg-[#000000] pb-36">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#000000]/95 backdrop-blur-sm border-b border-[#262626] px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onFinish}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors active:scale-95 flex-shrink-0 -ml-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-[#CAFF40] truncate">
              {trainingDay.focus}
            </p>
            <h1 className="text-xl font-black text-[#FFFFFF] truncate">{trainingDay.day_name}</h1>
          </div>

          {restTimer !== null && restTimer > 0 && (
            <div className="flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl px-3 py-1.5 flex-shrink-0">
              <Timer className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-sm font-mono font-bold text-[#22C55E]">
                {formatTime(restTimer)}
              </span>
              <button
                onClick={() => setRestTimer(null)}
                className="text-[10px] text-[#5C5C5C] ml-0.5 hover:text-[#A0A0A0]"
              >
                skip
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#CAFF40] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-[#5C5C5C] mt-1.5 font-mono">
          {doneSets} / {totalSets} sets
        </p>
      </div>

      {/* Exercise list */}
      <div className="px-5 pt-4 space-y-3">
        {trainingDay.exercises.map((ex, exIdx) => {
          const log = logs[exIdx];
          const doneCount = log.sets.filter(s => s.completed).length;
          const isFullyDone = doneCount === ex.sets;

          return (
            <div
              key={exIdx}
              className={`bg-[#0D0D0D] border rounded-2xl overflow-hidden transition-colors ${
                isFullyDone ? 'border-[#22C55E]/40' : 'border-[#CAFF40]/20'
              }`}
            >
              {/* Exercise header row */}
              <button
                onClick={() => toggleExpand(exIdx)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isFullyDone ? 'bg-[#22C55E]/20' : 'bg-[#CAFF40]/10'
                    }`}
                  >
                    {isFullyDone ? (
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    ) : (
                      <span className="text-xs font-bold text-[#CAFF40]">{exIdx + 1}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#FFFFFF]">{ex.name}</p>
                    <p className="text-xs text-[#A0A0A0]">
                      {ex.sets} × {ex.reps} · RPE {ex.rpe} · {ex.rest_seconds}s rest
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#5C5C5C]">{doneCount}/{ex.sets}</span>
                  {log.expanded ? (
                    <ChevronUp className="w-4 h-4 text-[#5C5C5C]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#5C5C5C]" />
                  )}
                </div>
              </button>

              {log.expanded && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3">
                  {ex.notes ? (
                    <p className="text-xs text-[#F97316] mb-3">{ex.notes}</p>
                  ) : null}

                  {/* Column headers */}
                  <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 mb-2 px-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">#</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">kg</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">reps</span>
                    <span />
                  </div>

                  <div className="space-y-2">
                    {log.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center transition-opacity ${
                          set.completed ? 'opacity-50' : ''
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-[#CAFF40]">
                          {setIdx + 1}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          value={set.weight_kg}
                          onChange={e => updateSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                          disabled={set.completed}
                          className="bg-[#0D0D0D] border border-[#262626] rounded-xl px-3 py-2 text-sm font-mono text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:border-[#CAFF40]/50 focus:outline-none disabled:cursor-default w-full"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          value={set.reps_completed}
                          onChange={e => updateSet(exIdx, setIdx, 'reps_completed', e.target.value)}
                          disabled={set.completed}
                          className="bg-[#0D0D0D] border border-[#262626] rounded-xl px-3 py-2 text-sm font-mono text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:border-[#CAFF40]/50 focus:outline-none disabled:cursor-default w-full"
                        />
                        <button
                          onClick={() => markSetComplete(exIdx, setIdx)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                            set.completed
                              ? 'bg-[#22C55E] border-[#22C55E]'
                              : 'bg-transparent border-[#262626] hover:border-[#CAFF40]/40'
                          }`}
                        >
                          <Check
                            className={`w-4 h-4 ${set.completed ? 'text-white' : 'text-[#5C5C5C]'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  {isFullyDone && (
                    <p className="text-xs text-[#22C55E] mt-3">
                      ↑ Hit the top of the rep range? Add 2.5 kg next week.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fixed finish button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-6 pt-3 bg-[#000000]/95 backdrop-blur-sm border-t border-[#262626] z-50">
        {saveError && (
          <p className="text-[#A0A0A0] text-sm text-center mb-3">
            Couldn't save your workout — tap below to retry.
          </p>
        )}
        <button
          onClick={finishWorkout}
          disabled={saving || saved}
          className="w-full py-4 bg-[#CAFF40] hover:bg-[#A8D930] text-[#000000] font-black text-sm uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {saved
            ? '✓ Workout Saved'
            : saving
            ? 'Saving…'
            : saveError
            ? 'Tap to Retry'
            : `Finish · ${trainingDay.duration_min}min planned`}
        </button>
      </div>
    </div>
  );
}
