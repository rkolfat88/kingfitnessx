import type { DailyState, EngineOutput } from './types';

export interface PerformanceScores {
  recovery: number;
  readiness: number;
  adherence: number;
  momentum: number;
  discipline: number;
  mind: number;
}

// Calculate performance scores from check-in history
export function calculateScores(
  recentCheckins: DailyState[],
  adherenceRate: number,
  streakDays: number,
  motivationBaseline: number
): EngineOutput<PerformanceScores> {
  const reasoning: string[] = [];
  const flags: string[] = [];

  if (recentCheckins.length === 0) {
    return {
      result: { recovery: 50, readiness: 50, adherence: 0, momentum: 50, discipline: 0, mind: motivationBaseline * 10 },
      reasoning: ['No check-in data yet — scores will populate as you log days'],
      flags: ['no_data'],
    };
  }

  const recent = recentCheckins.slice(0, 7);
  const avg = (key: keyof DailyState) => recent.reduce((s, c) => s + (c[key] || 5), 0) / recent.length;

  const avgSoreness = avg('soreness');
  const avgEnergy = avg('energy');
  const avgMotivation = avg('motivation');
  const avgMood = avg('mood');
  const avgSleep = avg('sleep_hours');

  // Recovery: inverse soreness + sleep quality
  const recovery = Math.round(Math.min(100, Math.max(0, (10 - avgSoreness) * 5 + (avgSleep / 8) * 50)));
  reasoning.push(`Recovery: soreness ${avgSoreness.toFixed(1)}/10 + sleep ${avgSleep.toFixed(1)}h → ${recovery}`);

  // Readiness: energy + recovery
  const readiness = Math.round(Math.min(100, avgEnergy * 6 + recovery * 0.4));
  reasoning.push(`Readiness: energy ${avgEnergy.toFixed(1)}/10 + recovery → ${readiness}`);

  // Adherence: from logged sessions
  const adherence = Math.round(adherenceRate * 100);
  reasoning.push(`Adherence: ${adherence}% of planned sessions completed`);

  // Momentum: trend of motivation + adherence
  const momentum = Math.round(Math.min(100, avgMotivation * 5 + adherence * 0.5));
  reasoning.push(`Momentum: motivation ${avgMotivation.toFixed(1)}/10 + adherence → ${momentum}`);

  // Discipline: streak + consistency
  const discipline = Math.round(Math.min(100, adherence * 0.6 + Math.min(streakDays * 3, 40)));
  reasoning.push(`Discipline: adherence + ${streakDays}-day streak → ${discipline}`);

  // Mind: motivation vs baseline + mood
  const mind = Math.round(Math.min(100, avgMotivation * 6 + avgMood * 4));
  reasoning.push(`Mind: motivation ${avgMotivation.toFixed(1)}/10 + mood ${avgMood.toFixed(1)}/10 → ${mind}`);

  // Flags
  if (recovery < 35) flags.push('recovery_debt');
  if (momentum >= 75) flags.push('momentum_building');
  if (discipline >= 80) flags.push('elite_discipline');

  return {
    result: { recovery, readiness, adherence, momentum, discipline, mind },
    reasoning,
    flags,
  };
}
