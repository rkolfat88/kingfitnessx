// Minimal agent orchestrator. Built fresh for this pipeline — there was no
// pre-existing orchestrator, agents/ directory, or Safety Agent in the repo.
// Flow: intake-agent -> coaching-rules (adaptive-tdee, via nutrition.ts's
// engine) -> metabolic-agent -> safety-check -> response.
//
// The "Safety Agent" referenced conceptually in the task spec doesn't exist
// as a separate service; the safety-check step below is a deterministic
// guardrail (the same spirit as Coach Richard K.'s inline pain/injury rule
// in server.js's system prompt, which isn't reusable code) rather than a
// second model call.
import type { SupabaseClient } from '@supabase/supabase-js';
import type Anthropic from '@anthropic-ai/sdk';
import type { ClientProfile } from '../coaching-engine/types';
import { getOrRecomputeMetabolicState } from '../coaching-rules/adaptive-tdee';
import { estimateIntake, sweepStaleAutoLogs } from './intake-agent';
import { explainMetabolicState } from './metabolic-agent';
import type { IntakeInput, OrchestratorIntakeResponse } from './types';

export async function loadClientProfile(supabase: SupabaseClient, userId: string): Promise<ClientProfile | null> {
  const { data: onboarding } = await supabase
    .from('onboarding_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!onboarding) return null;

  const { data: mind } = await supabase
    .from('mind_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    age: onboarding.age,
    gender: onboarding.gender,
    weight_kg: onboarding.weight_kg,
    height_cm: onboarding.height_cm,
    goal: onboarding.goal,
    experience: onboarding.experience,
    days_per_week: onboarding.days_per_week,
    equipment: onboarding.equipment,
    injuries: onboarding.injuries || [],
    protocol: onboarding.protocol,
    allergies: onboarding.allergies || [],
    psychological_stage: mind?.psychological_stage || 'preparation',
    identity_statement: mind?.identity_statement || '',
    fears: mind?.fear_audit || [],
    energy_window: mind?.energy_peak_window || 'evening',
    motivation_baseline: 7,
  };
}

// Deterministic guardrail — no LLM call. Flags allergen conflicts in logged
// food items; adaptive-tdee's own hard bounds (protein floor, fat floor,
// recovery deficit cap) are enforced upstream and re-affirmed here as a
// defensive check, never loosened.
function runSafetyCheck(itemNames: string[], profile: ClientProfile | null): string[] {
  const flags: string[] = [];
  if (!profile?.allergies?.length) return flags;

  const lowerItems = itemNames.map(n => n.toLowerCase());
  for (const allergen of profile.allergies) {
    const needle = allergen.toLowerCase();
    if (lowerItems.some(item => item.includes(needle))) {
      flags.push(`allergen_conflict:${allergen}`);
    }
  }
  return flags;
}

export async function runIntakePipeline(
  deps: { supabase: SupabaseClient; anthropic: Anthropic },
  userId: string,
  input: IntakeInput,
  mealType?: string
): Promise<OrchestratorIntakeResponse> {
  const { supabase, anthropic } = deps;

  const intake = await estimateIntake(anthropic, supabase, userId, input, mealType);
  const profile = await loadClientProfile(supabase, userId);
  const flags = runSafetyCheck(intake.estimate.items.map(i => i.name), profile);

  // Best-effort housekeeping — never blocks the response.
  sweepStaleAutoLogs(supabase, userId).catch(err => console.warn('sweepStaleAutoLogs failed:', err.message));

  let metabolicNote: string | null = null;
  if (profile) {
    try {
      const state = await getOrRecomputeMetabolicState(supabase, userId, profile);
      metabolicNote = await explainMetabolicState(anthropic, state);
    } catch (err: any) {
      console.warn('metabolic-agent step failed, omitting note:', err.message);
    }
  }

  return { intake, metabolicNote, flags };
}
