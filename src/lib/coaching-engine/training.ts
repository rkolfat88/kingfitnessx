import type { ClientProfile, TrainingPlan, TrainingDay, Exercise, EngineOutput, Verification } from './types';

// Determine training split based on days and experience
function getSplitType(daysPerWeek: number, experience: string): string {
  if (daysPerWeek <= 2) return 'Full Body';
  if (daysPerWeek === 3) return experience === 'beginner' ? 'Full Body' : 'Push/Pull/Legs';
  if (daysPerWeek === 4) return 'Upper/Lower Split';
  if (daysPerWeek === 5) return 'Push/Pull/Legs + Upper/Lower';
  return 'Push/Pull/Legs ×2';
}

// Exercise library by equipment and pattern
const EXERCISE_LIBRARY: Record<string, Record<string, string[]>> = {
  push: {
    gym: ['Barbell Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Cable Flyes', 'Tricep Pushdowns', 'Lateral Raises'],
    home: ['Push-Ups', 'Pike Push-Ups', 'Dips (chair)', 'Diamond Push-Ups', 'Decline Push-Ups'],
  },
  pull: {
    gym: ['Deadlift', 'Pull-Ups', 'Barbell Row', 'Lat Pulldown', 'Face Pulls', 'Barbell Curls'],
    home: ['Pull-Ups (door bar)', 'Inverted Rows', 'Backpack Rows', 'Towel Curls', 'Superman Holds'],
  },
  legs: {
    gym: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises', 'Walking Lunges'],
    home: ['Bodyweight Squats', 'Bulgarian Split Squats', 'Glute Bridges', 'Wall Sits', 'Calf Raises', 'Lunges'],
  },
};

// Injury-based substitutions
const INJURY_SUBS: Record<string, Record<string, string>> = {
  knee: { 'Back Squat': 'Box Squat (partial)', 'Walking Lunges': 'Leg Press (limited ROM)', 'Bulgarian Split Squats': 'Glute Bridges' },
  shoulder: { 'Overhead Press': 'Landmine Press', 'Barbell Bench Press': 'Floor Press', 'Pull-Ups': 'Lat Pulldown' },
  back: { 'Deadlift': 'Trap Bar Deadlift', 'Barbell Row': 'Chest-Supported Row', 'Romanian Deadlift': 'Leg Curl' },
};

function repsForGoal(goal: string): { reps: string; rpe: number; rest: number; velocityNote: string } {
  if (goal === 'muscle_gain') return { reps: '8-12', rpe: 8, rest: 90, velocityNote: 'Controlled 2-3s eccentric, explosive concentric' };
  if (goal === 'fat_loss') return { reps: '12-15', rpe: 7, rest: 60, velocityNote: 'Circuit-style, minimal rest, maintain form' };
  if (goal === 'recomp') return { reps: '8-12', rpe: 8, rest: 75, velocityNote: 'Moderate tempo, focus on mind-muscle connection' };
  return { reps: '10-12', rpe: 7, rest: 75, velocityNote: 'Controlled tempo' };
}

function setsForExperience(experience: string): number {
  if (experience === 'beginner') return 3;
  if (experience === 'intermediate') return 4;
  return 4;
}

function weeklyVolumeTarget(experience: string): string {
  if (experience === 'beginner') return '8-10';
  if (experience === 'intermediate') return '12-16';
  return '14-18';
}

function buildDay(
  dayName: string,
  focus: string,
  pattern: string,
  profile: ClientProfile
): TrainingDay {
  const equipment = profile.equipment === 'both' ? 'gym' : profile.equipment;
  const exercisePool = EXERCISE_LIBRARY[pattern]?.[equipment] || EXERCISE_LIBRARY[pattern]?.['gym'] || [];
  const { reps, rpe, rest, velocityNote } = repsForGoal(profile.goal);
  const sets = setsForExperience(profile.experience);

  // Beginners get fewer exercises
  const count = profile.experience === 'beginner' ? 4 : 6;

  const exercises: Exercise[] = exercisePool.slice(0, count).map((name, i) => {
    // Apply injury substitutions
    let finalName = name;
    let injuryNote = '';
    for (const injury of profile.injuries) {
      const subKey = injury.toLowerCase();
      if (INJURY_SUBS[subKey]?.[name]) {
        injuryNote = `Substituted for ${name} (injury accommodation)`;
        finalName = INJURY_SUBS[subKey][name];
      }
    }

    return {
      name: finalName,
      sets: i === 0 ? sets : Math.max(3, sets - 1), // first compound gets most sets
      reps,
      rpe: i === 0 ? rpe + 1 : rpe, // first compound slightly harder
      rest_seconds: i < 2 ? rest + 30 : rest, // compounds get more rest
      notes: injuryNote,
    };
  });

  return {
    day_name: dayName,
    focus,
    duration_min: profile.experience === 'beginner' ? 45 : 60,
    exercises,
    notes: velocityNote,
  };
}

export function buildTrainingPlan(profile: ClientProfile): EngineOutput<TrainingPlan> {
  const reasoning: string[] = [];
  const flags: string[] = [];
  const verifications: Verification[] = [];

  const splitType = getSplitType(profile.days_per_week, profile.experience);
  reasoning.push(`${profile.days_per_week} days/week + ${profile.experience} → ${splitType}`);

  if (!profile.trainingFrequencyConfirmed) {
    verifications.push({
      field: 'days_per_week',
      assumption: `Built a ${splitType} split around ${profile.days_per_week} days/week from onboarding`,
      message: `This split assumes you're training ${profile.days_per_week}x/week. If that's changed, confirm — the split and volume both depend on it.`,
      severity: 'important',
    });
  }

  if (profile.injuries.length > 0) {
    const unhandled = profile.injuries.filter(i => !INJURY_SUBS[i.toLowerCase()]);
    if (unhandled.length > 0) {
      verifications.push({
        field: 'injury_substitutions',
        assumption: `No known substitution pattern for: ${unhandled.join(', ')} — those exercises were left as-is`,
        message: `We don't have a substitution rule for "${unhandled.join(', ')}" yet. Flag any exercise below that aggravates it and we'll swap it.`,
        severity: 'safety',
      });
    }
  }

  // Floor Mode for low psychological readiness
  if (profile.psychological_stage === 'contemplation' || profile.psychological_stage === 'precontemplation') {
    reasoning.push(`Psychological stage: ${profile.psychological_stage} → starting with reduced volume to build the habit first`);
    flags.push('floor_mode_start');
  }

  const { reps, rpe } = repsForGoal(profile.goal);
  reasoning.push(`Goal ${profile.goal} → ${reps} reps @ RPE ${rpe}`);
  reasoning.push(`Experience ${profile.experience} → ${setsForExperience(profile.experience)} sets per exercise`);
  const weeklyVol = weeklyVolumeTarget(profile.experience);
  reasoning.push(`Volume set to ${weeklyVol} sets/muscle/week — at the diminishing-returns knee for your experience level`);

  if (profile.injuries.length > 0) {
    reasoning.push(`Injuries (${profile.injuries.join(', ')}) → exercises substituted for safe alternatives`);
    flags.push('injury_accommodations');
  }

  // Build days based on split
  const days: TrainingDay[] = [];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (splitType === 'Full Body') {
    for (let i = 0; i < profile.days_per_week; i++) {
      // Full body rotates emphasis
      const pattern = i % 3 === 0 ? 'legs' : i % 3 === 1 ? 'push' : 'pull';
      days.push(buildDay(dayLabels[i * 2] || dayLabels[i], `Full Body (${pattern} emphasis)`, pattern, profile));
    }
  } else if (splitType.includes('Push/Pull/Legs')) {
    const patterns = ['push', 'pull', 'legs'];
    for (let i = 0; i < profile.days_per_week; i++) {
      const pattern = patterns[i % 3];
      days.push(buildDay(dayLabels[i], pattern.charAt(0).toUpperCase() + pattern.slice(1), pattern, profile));
    }
  } else {
    // Upper/Lower
    for (let i = 0; i < profile.days_per_week; i++) {
      const isUpper = i % 2 === 0;
      const pattern = isUpper ? (i % 4 === 0 ? 'push' : 'pull') : 'legs';
      days.push(buildDay(dayLabels[i], isUpper ? 'Upper Body' : 'Lower Body', pattern, profile));
    }
  }

  if (profile.age >= 35) {
    const powerNote = 'Explosive intent on all concentric phases. Power declines 2x faster than strength after 35 — move the weight with intent.';
    for (const day of days) {
      day.notes = day.notes ? `${day.notes}. ${powerNote}` : powerNote;
    }
    flags.push('power_emphasis_35_plus');
    reasoning.push('Age 35+ → explosive concentric intent added to preserve fast-twitch fiber recruitment');
  }

  return {
    result: {
      split_type: splitType,
      days_per_week: profile.days_per_week,
      mesocycle_week: 1,
      days,
      notes: `Built around your ${profile.energy_window} energy window. Progressive overload: when you hit the top of the rep range, add 2.5kg next week.`,
    },
    reasoning,
    flags,
    verifications,
  };
}
