// Adaptive TDEE learner — deterministic, no LLM calls.
//
// Unlike src/lib/coaching-engine (pure functions, zero I/O), this module reads
// and writes Supabase directly: it aggregates food_logs + daily_checkins into a
// learned energy-expenditure estimate and upserts it to metabolic_state. The
// caller (server.js, an agent, or a scheduled job) supplies the Supabase client.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClientProfile, MacroTargets, EngineOutput } from '../coaching-engine/types';
import { calculateMacros, calculateBMR, activityMultiplier } from '../coaching-engine/nutrition';

const ALPHA = 0.1;                      // exponential smoothing factor for trend weight
const WINDOW_DAYS = 21;                 // rolling window for weight + intake
const SPIKE_THRESHOLD_PCT = 0.02;       // ignore single-day weight jumps >2%
const KCAL_PER_KG = 7700;
const COLD_START_MIN_DAYS = 7;          // below this: prior only, confidence 0
const COLD_START_FULL_DAYS = 14;        // blend reaches 100% learned at this point
const MAX_ADJUSTMENT_KCAL = 150;        // clamp change per recompute vs. last estimate
const RECOMPUTE_INTERVAL_DAYS = 7;
const FAT_FLOOR_PCT = 0.25;             // hard bound: fat never below 25% of calories
const RECOVERY_DEFICIT_CAP_PCT = 0.18;  // hard bound: recovery/injury deficit capped ~18%

export interface MetabolicState {
  user_id: string;
  estimated_tdee: number;
  trend_weight_kg: number | null;
  confidence: number;
  data_days: number;
  delta_explanation: string;
  updated_at: string;
}

interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface FoodLogRow {
  logged_at: string;
  kcal: number;
  source: string;
  verified: boolean;
}

// ── Trend weight: exponential smoothing, ignoring single-day spikes >2% ──────
function computeTrendWeight(entries: WeightEntry[]): {
  latest: number | null;
  earliest: number | null;
  points: number;
} {
  if (entries.length === 0) return { latest: null, earliest: null, points: 0 };
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  let smoothed = sorted[0].weight_kg;
  const series = [smoothed];
  for (let i = 1; i < sorted.length; i++) {
    const raw = sorted[i].weight_kg;
    const pctChange = Math.abs(raw - smoothed) / smoothed;
    if (pctChange > SPIKE_THRESHOLD_PCT) continue; // ignore the spike entirely
    smoothed = ALPHA * raw + (1 - ALPHA) * smoothed;
    series.push(smoothed);
  }
  return { latest: series[series.length - 1], earliest: series[0], points: series.length };
}

// ── Mean daily intake, weighting unconfirmed auto-logs at 0.8 ────────────────
function computeMeanDailyIntake(logs: FoodLogRow[]): { meanKcal: number; dataDays: number } {
  const byDate = new Map<string, number>();
  for (const log of logs) {
    const date = log.logged_at.slice(0, 10);
    const weight = log.source === 'auto' && !log.verified ? 0.8 : 1.0;
    byDate.set(date, (byDate.get(date) ?? 0) + log.kcal * weight);
  }
  const days = [...byDate.values()];
  if (days.length === 0) return { meanKcal: 0, dataDays: 0 };
  return { meanKcal: days.reduce((s, v) => s + v, 0) / days.length, dataDays: days.length };
}

export function computeStaticTDEE(profile: ClientProfile): number {
  return calculateBMR(profile) * activityMultiplier(profile.days_per_week);
}

export interface AdaptiveTDEEResult {
  estimatedTDEE: number;
  confidence: number;
  dataDays: number;
  trendWeightKg: number | null;
  deltaExplanation: string;
}

// Cold-start blend: 0 below 7 logged days (prior only, confidence forced to 0),
// then linear 0→1 across the 0→14 day range (so confidence crosses the 0.5
// gate used by getAdaptiveMacros somewhere after day 7).
function blendFactor(dataDays: number): number {
  return Math.min(1, Math.max(0, dataDays / COLD_START_FULL_DAYS));
}

export async function computeAdaptiveTDEE(
  supabase: SupabaseClient,
  userId: string,
  profile: ClientProfile,
  previousEstimatedTDEE?: number | null
): Promise<AdaptiveTDEEResult> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
  const windowStartDate = windowStart.toISOString().slice(0, 10);

  const staticTDEE = computeStaticTDEE(profile);

  // Trend weight from daily_checkins.weight_kg. That column isn't part of the
  // audited daily_checkins schema as of this module's authoring — if it's
  // missing, degrade to no weight data rather than throwing.
  let weightEntries: WeightEntry[] = [];
  try {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('checkin_date, weight_kg')
      .eq('user_id', userId)
      .gte('checkin_date', windowStartDate)
      .not('weight_kg', 'is', null);
    if (!error && data) {
      weightEntries = data
        .filter((r: any) => typeof r.weight_kg === 'number')
        .map((r: any) => ({ date: r.checkin_date, weight_kg: r.weight_kg }));
    }
  } catch {
    // no-op — trend term simply stays unavailable
  }

  const trend = computeTrendWeight(weightEntries);

  const { data: foodLogs } = await supabase
    .from('food_logs')
    .select('logged_at, kcal, source, verified')
    .eq('user_id', userId)
    .gte('logged_at', windowStart.toISOString());

  const { meanKcal, dataDays } = computeMeanDailyIntake((foodLogs ?? []) as FoodLogRow[]);

  const blend = blendFactor(dataDays);
  const confidence = dataDays < COLD_START_MIN_DAYS ? 0 : blend;

  let learnedTDEE = staticTDEE;
  let deltaExplanation = `Fewer than ${COLD_START_MIN_DAYS} logged days — using your onboarding estimate (${Math.round(staticTDEE)} kcal) until more data comes in.`;

  if (dataDays > 0) {
    // Positive deltaKgLost = weight went down over the window => expenditure > intake.
    const deltaKgLost = trend.earliest != null && trend.latest != null ? trend.earliest - trend.latest : 0;
    const windowDaysActual = Math.max(1, Math.min(WINDOW_DAYS, dataDays));
    const rawLearnedTDEE = meanKcal + (deltaKgLost * KCAL_PER_KG) / windowDaysActual;
    learnedTDEE = staticTDEE * (1 - blend) + rawLearnedTDEE * blend;

    if (dataDays >= COLD_START_MIN_DAYS) {
      const direction = rawLearnedTDEE < staticTDEE ? 'down' : 'up';
      const weightNote = trend.points > 1
        ? `, trend weight ${deltaKgLost >= 0 ? '−' : '+'}${Math.abs(deltaKgLost).toFixed(1)}kg`
        : '';
      deltaExplanation = `Learned expenditure trending ${direction} to ~${Math.round(rawLearnedTDEE)} kcal from ${dataDays} logged days (avg intake ${Math.round(meanKcal)} kcal${weightNote}). Blended ${Math.round(blend * 100)}% learned / ${Math.round((1 - blend) * 100)}% onboarding estimate.`;
    }
  }

  // Clamp the change vs. the last stored estimate — never move more than ±150/adjustment.
  let finalTDEE = learnedTDEE;
  if (previousEstimatedTDEE != null) {
    const delta = finalTDEE - previousEstimatedTDEE;
    if (Math.abs(delta) > MAX_ADJUSTMENT_KCAL) {
      finalTDEE = previousEstimatedTDEE + Math.sign(delta) * MAX_ADJUSTMENT_KCAL;
      deltaExplanation += ` Adjustment clamped to ±${MAX_ADJUSTMENT_KCAL} kcal from the last estimate.`;
    }
  }

  return {
    estimatedTDEE: Math.round(finalTDEE),
    confidence: Math.round(confidence * 100) / 100,
    dataDays,
    trendWeightKg: trend.latest,
    deltaExplanation,
  };
}

// ── Weekly recompute gate + upsert ────────────────────────────────────────────
export async function getOrRecomputeMetabolicState(
  supabase: SupabaseClient,
  userId: string,
  profile: ClientProfile
): Promise<MetabolicState> {
  const { data: existing } = await supabase
    .from('metabolic_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const isStale =
    !existing ||
    Date.now() - new Date(existing.updated_at).getTime() > RECOMPUTE_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

  if (existing && !isStale) {
    return existing as MetabolicState;
  }

  const adaptive = await computeAdaptiveTDEE(supabase, userId, profile, existing?.estimated_tdee ?? null);

  const nextState: MetabolicState = {
    user_id: userId,
    estimated_tdee: adaptive.estimatedTDEE,
    trend_weight_kg: adaptive.trendWeightKg,
    confidence: adaptive.confidence,
    data_days: adaptive.dataDays,
    delta_explanation: adaptive.deltaExplanation,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('metabolic_state').upsert(nextState, { onConflict: 'user_id' });
  if (error) {
    console.warn('metabolic_state upsert failed:', error.message);
  }

  return nextState;
}

// ── Hard bounds — never overridden by the learner ─────────────────────────────
// Protein (2.2g × lean mass, or the engine's age/GLP-1 tiers) is untouched here:
// this function only ever adjusts calories/carbs/fat, never protein_g, so the
// protein floor holds structurally regardless of which TDEE source was used.
export function enforceHardBounds(profile: ClientProfile, targets: MacroTargets, staticTDEE: number): MacroTargets {
  let { calories, protein_g, carbs_g, fat_g } = targets;

  // Fat floor: 25% of calories.
  const fatFloorG = Math.round((calories * FAT_FLOOR_PCT) / 9);
  if (fat_g < fatFloorG) {
    const extraFatG = fatFloorG - fat_g;
    fat_g = fatFloorG;
    carbs_g = Math.max(0, carbs_g - Math.round((extraFatG * 9) / 4));
  }

  // Recovery / post-surgical deficit capped ~18% below the static baseline.
  if (profile.injuries.length > 0) {
    const floorCalories = Math.round(staticTDEE * (1 - RECOVERY_DEFICIT_CAP_PCT));
    if (calories < floorCalories) {
      calories = floorCalories;
    }
  }

  return { calories: Math.round(calories), protein_g, carbs_g, fat_g };
}

// ── Integration point for engine.ts callers ───────────────────────────────────
// Uses the adaptive estimate once metabolic_state.confidence > 0.5; otherwise
// falls back to calculateMacros' existing static Mifflin-St Jeor path untouched.
// Existing refeed / mass-gain / fat-loss goal adjustments in calculateMacros
// still run on top of whichever TDEE baseline is chosen, so they always take
// precedence over the adaptive delta itself.
export async function getAdaptiveMacros(
  supabase: SupabaseClient,
  userId: string,
  profile: ClientProfile
): Promise<EngineOutput<MacroTargets> & { usedAdaptive: boolean; metabolicState: MetabolicState }> {
  const state = await getOrRecomputeMetabolicState(supabase, userId, profile);
  const staticTDEE = computeStaticTDEE(profile);
  const useAdaptive = state.confidence > 0.5;

  const engineOutput = useAdaptive
    ? calculateMacros(profile, {
        value: state.estimated_tdee,
        source: 'adaptive',
        reasoning: [
          `Adaptive TDEE (confidence ${Math.round(state.confidence * 100)}%): ${state.estimated_tdee} cal — ${state.delta_explanation}`,
        ],
      })
    : calculateMacros(profile);

  return {
    ...engineOutput,
    result: enforceHardBounds(profile, engineOutput.result, staticTDEE),
    usedAdaptive: useAdaptive,
    metabolicState: state,
  };
}
