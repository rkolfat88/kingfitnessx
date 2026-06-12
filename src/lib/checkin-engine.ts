import type { DailyState, TrainingDay } from './coaching-engine/types';

// Convert 5-point scale to engine's 10-point scale
function to10(val: number): number {
  return val * 2;
}

// Map check-in data to DailyState for the adapt engine
export function checkinToDailyState(
  sleepQuality: number,  // 1-5
  energy: number,        // 1-5
  soreness: number       // 1-5
): DailyState {
  return {
    motivation: to10(energy),    // energy proxies motivation
    energy: to10(energy),
    soreness: to10(soreness),
    sleep_hours: sleepQuality >= 4 ? 7.5 : sleepQuality >= 3 ? 6.5 : 5,
    mood: to10(energy),
  };
}

// Generate the counterfactual — what would have happened without check-in
export function generateCounterfactual(
  planned: TrainingDay,
  state: DailyState
): string | null {
  const isFloor = state.motivation <= 3;
  const isCNS = state.sleep_hours < 6 && state.soreness >= 8;
  const isReduced = state.motivation <= 6 || state.energy <= 4;
  const isPeak = state.motivation >= 8 && state.energy >= 7;

  if (isFloor) {
    return `Without today's check-in, you'd have seen the full ${planned.duration_min}-min session — ${planned.exercises.length} exercises. The engine would not have known to protect you.`;
  }
  if (isCNS) {
    return `Without the check-in, the full ${planned.exercises.length}-exercise session would have run. CNS deficit would have gone undetected.`;
  }
  if (isReduced) {
    return `Without the check-in, today called for ${planned.exercises.reduce((s, e) => s + e.sets, 0)} total sets. With it: ${Math.ceil(planned.exercises.reduce((s, e) => s + e.sets, 0) * 0.8)} sets. Your data changed the plan.`;
  }
  if (isPeak) {
    return `Without the check-in, today was a standard session. Your green signals unlocked an extra set on the first compound — that's the marginal gain that compounds over months.`;
  }
  return null;
}

// Streak calculation
export function calculateNewStreak(
  currentStreak: number,
  lastCheckinDate: string | null,
  today: string
): { newStreak: number; broken: boolean } {
  if (!lastCheckinDate) {
    return { newStreak: 1, broken: false };
  }

  const last = new Date(lastCheckinDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return { newStreak: currentStreak, broken: false };
  }
  if (diffDays === 1) {
    return { newStreak: currentStreak + 1, broken: false };
  }
  return { newStreak: 1, broken: true };
}

// Milestone check
export function checkMilestone(streak: number): {
  isMilestone: boolean;
  title: string;
  message: string;
} | null {
  const milestones: Record<number, { title: string; message: string }> = {
    3: {
      title: "3 Days on Protocol",
      message: "Three consecutive days. The pattern has begun.",
    },
    7: {
      title: "One Week Solid",
      message: "7 days. Loss aversion is now working FOR you, not against you.",
    },
    14: {
      title: "Two Weeks In",
      message: "14 days. You're past the point where most people quit.",
    },
    30: {
      title: "30 Days on Protocol",
      message: "A month of evidence. The identity is getting harder to deny.",
    },
    66: {
      title: "This Is Now Who You Are",
      message: "Day 66. Habit formation research says this is the inflection point. You're not building a habit anymore — you have one.",
    },
    100: {
      title: "100 Days",
      message: "100 pieces of evidence. This is a different person than the one who started.",
    },
    180: {
      title: "Half a Year",
      message: "180 days on protocol. At this point, the data is undeniable.",
    },
    365: {
      title: "One Year",
      message: "365 days. You are now in the top fraction of a percent of people who ever started a fitness program.",
    },
  };

  if (milestones[streak]) {
    return { isMilestone: true, ...milestones[streak] };
  }
  return null;
}

// Weekly debrief generator (deterministic)
export function generateWeeklyDebrief(
  plannedSessions: number,
  completedSessions: number,
  avgSleep: number,
  avgEnergy: number,
  avgSoreness: number,
  currentStreak: number
): { text: string; highlights: string[]; nextWeekFocus: string } {
  const adherence = Math.round((completedSessions / plannedSessions) * 100);
  const highlights: string[] = [];
  let text = '';
  let nextWeekFocus = '';

  if (adherence >= 100) highlights.push(`Perfect week — ${completedSessions}/${plannedSessions} sessions completed`);
  else if (adherence >= 80) highlights.push(`Strong adherence — ${completedSessions}/${plannedSessions} sessions`);
  else highlights.push(`${completedSessions} of ${plannedSessions} sessions completed`);

  if (avgSleep >= 4) highlights.push(`Sleep quality averaged ${avgSleep.toFixed(1)}/5 — recovery is working`);
  else if (avgSleep < 3) highlights.push(`Sleep averaged ${avgSleep.toFixed(1)}/5 — priority for next week`);

  if (currentStreak >= 7) highlights.push(`${currentStreak}-day protocol streak — momentum is real`);

  if (adherence >= 80 && avgEnergy >= 3.5) {
    text = `Solid week. ${completedSessions} sessions, energy held up, recovery adequate. The engine saw no red flags — next week runs at full prescription.`;
    nextWeekFocus = 'Execute the plan. Progressive overload on primary lifts where top of rep range was hit.';
  } else if (adherence >= 80 && avgEnergy < 3.5) {
    text = `You showed up — ${completedSessions} sessions — but energy was below baseline this week. Volume was auto-reduced on ${Math.round((1 - avgEnergy / 5) * 100)}% of sessions. Sleep is the lever.`;
    nextWeekFocus = 'Sleep quality first. Target 4/5 average before pushing volume back up.';
  } else if (adherence < 80 && avgEnergy >= 3.5) {
    text = `Energy was there — ${avgEnergy.toFixed(1)}/5 average — but ${plannedSessions - completedSessions} sessions were missed. The gap is scheduling, not capacity.`;
    nextWeekFocus = "Anchor training to a fixed cue. The body was ready; the habit wasn't.";
  } else {
    text = `Tough week — ${completedSessions} sessions, energy at ${avgEnergy.toFixed(1)}/5. The engine tracked this and protected you from overreach. Recovery comes before performance.`;
    nextWeekFocus = "Floor Mode available any day this week. Show up for 2 minutes minimum. The streak is more valuable than the session right now.";
  }

  return { text, highlights, nextWeekFocus };
}
