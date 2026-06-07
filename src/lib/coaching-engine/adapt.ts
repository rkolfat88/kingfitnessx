import type { TrainingDay, DailyState, EngineOutput } from './types';

// Adapt today's planned session based on the morning check-in
export function adaptSession(
  planned: TrainingDay,
  state: DailyState,
  identityStatement: string
): EngineOutput<TrainingDay> {
  const reasoning: string[] = [];
  const flags: string[] = [];
  let adapted = JSON.parse(JSON.stringify(planned)) as TrainingDay;

  // FLOOR MODE: motivation <= 3
  if (state.motivation <= 3) {
    reasoning.push(`Motivation ${state.motivation}/10 → FLOOR MODE activated`);
    reasoning.push(`Today's only job: 2 minutes. One exercise. Prove showing up is safe.`);
    flags.push('floor_mode');
    adapted = {
      ...adapted,
      focus: 'Floor Mode — Keep the Streak',
      duration_min: 5,
      exercises: [{
        ...adapted.exercises[0],
        sets: 1,
        reps: '10',
        rpe: 5,
        rest_seconds: 0,
        notes: `Just this. One set. "${identityStatement}" shows up even today.`,
      }],
    };
    return { result: adapted, reasoning, flags };
  }

  // CNS PROTECTION: sleep < 6h AND soreness >= 8
  if (state.sleep_hours < 6 && state.soreness >= 8) {
    reasoning.push(`Sleep ${state.sleep_hours}h + soreness ${state.soreness}/10 → CNS deficit detected`);
    reasoning.push(`Volume cut 30% to protect your nervous system. Intensity stays, accessories drop.`);
    flags.push('cns_protection');
    adapted.exercises = adapted.exercises.slice(0, Math.ceil(adapted.exercises.length * 0.7));
    adapted.exercises = adapted.exercises.map(e => ({ ...e, sets: Math.max(2, e.sets - 1) }));
    adapted.duration_min = Math.round(adapted.duration_min * 0.7);
    return { result: adapted, reasoning, flags };
  }

  // REDUCED VOLUME: motivation 4-6 OR energy <= 4
  if (state.motivation <= 6 || state.energy <= 4) {
    reasoning.push(`Motivation ${state.motivation}/10, energy ${state.energy}/10 → volume reduced 20%`);
    reasoning.push(`Consistency over intensity today. Showing up at 80% beats skipping at 100%.`);
    flags.push('reduced_volume');
    adapted.exercises = adapted.exercises.map(e => ({ ...e, sets: Math.max(2, e.sets - 1) }));
    return { result: adapted, reasoning, flags };
  }

  // HIGH SORENESS: soreness >= 7 (but slept ok)
  if (state.soreness >= 7) {
    reasoning.push(`Soreness ${state.soreness}/10 → reduced loading, added warm-up focus`);
    flags.push('high_soreness');
    adapted.exercises = adapted.exercises.map(e => ({ ...e, rpe: Math.max(6, e.rpe - 1) }));
    return { result: adapted, reasoning, flags };
  }

  // PEAK STATE: motivation >= 8 AND energy >= 7
  if (state.motivation >= 8 && state.energy >= 7) {
    reasoning.push(`Motivation ${state.motivation}/10 + energy ${state.energy}/10 → PEAK STATE`);
    reasoning.push(`This is the day to push. Add a set to your first compound. Go for it.`);
    flags.push('peak_state');
    if (adapted.exercises[0]) {
      adapted.exercises[0] = { ...adapted.exercises[0], sets: adapted.exercises[0].sets + 1 };
    }
    return { result: adapted, reasoning, flags };
  }

  // NORMAL
  reasoning.push(`All systems normal. Execute the plan as written.`);
  return { result: adapted, reasoning, flags };
}
