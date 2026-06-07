import type { ClientProfile, TrainingPlan, TrainingDay, Exercise, EngineOutput } from './types';

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

function repsForGoal(goal: string): { reps: string; rpe: number; rest: number } {
  if (goal === 'muscle_gain') return { reps: '8-12', rpe: 8, rest: 90 };
  if (goal === 'fat_loss') return { reps: '12-15', rpe: 7, rest: 60 };
  if (goal === 'recomp') return { reps: '8-12', rpe: 8, rest: 75 };
  return { reps: '10-12', rpe: 7, rest: 75 };
}

function setsForExperience(experience: string): number {
  if (experience === 'beginner') return 3;
  if (experience === 'intermediate') return 4;
  return 4;
}

function buildDay(
  dayName: string,
  focus: string,
  pattern: string,
  profile: ClientProfile
): TrainingDay {
  const equipment = profile.equipment === 'both' ? 'gym' : profile.equipment;
  const exercisePool = EXERCISE_LIBRARY[pattern]?.[equipment] || EXERCISE_LIBRARY[pattern]?.['gym'] || [];
  const { reps, rpe, rest } = repsForGoal(profile.goal);
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
  };
}

export function buildTrainingPlan(profile: ClientProfile): EngineOutput<TrainingPlan> {
  const reasoning: string[] = [];
  const flags: string[] = [];

  const splitType = getSplitType(profile.days_per_week, profile.experience);
  reasoning.push(`${profile.days_per_week} days/week + ${profile.experience} → ${splitType}`);

  // Floor Mode for low psychological readiness
  if (profile.psychological_stage === 'contemplation' || profile.psychological_stage === 'precontemplation') {
    reasoning.push(`Psychological stage: ${profile.psychological_stage} → starting with reduced volume to build the habit first`);
    flags.push('floor_mode_start');
  }

  const { reps, rpe } = repsForGoal(profile.goal);
  reasoning.push(`Goal ${profile.goal} → ${reps} reps @ RPE ${rpe}`);
  reasoning.push(`Experience ${profile.experience} → ${setsForExperience(profile.experience)} sets per exercise`);

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
  };
}
