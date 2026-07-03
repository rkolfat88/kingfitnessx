import { supabase } from './supabase';
import { calculateMacros, buildTrainingPlan } from './coaching-engine';
import type { ClientProfile } from './coaching-engine/types';

export interface GeneratedPlanData {
  trainingReasoning: string[]
  splitType: string
  daysPerWeek: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  macroReasoning: string[]
}

export async function generatePlans(userId: string): Promise<{ success: boolean; error?: string; data: GeneratedPlanData | null }> {
  try {
    const { data: onboarding, error: oErr } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (oErr || !onboarding) return { success: false, error: 'No onboarding data found', data: null };
    console.log('Raw onboarding data:', JSON.stringify(onboarding));

    const { data: mind } = await supabase
      .from('mind_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const profile: ClientProfile = {
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

    const macroOutput = calculateMacros(profile);
    const trainingOutput = buildTrainingPlan(profile);

    const { error: nErr } = await supabase
      .from('nutrition_plans')
      .upsert({
        user_id: userId,
        plan_data: {
          protocol: profile.protocol,
          macros: macroOutput.result,
          reasoning: macroOutput.reasoning,
          flags: macroOutput.flags,
          verifications: macroOutput.verifications,
        },
        protocol: profile.protocol,
        daily_calories: macroOutput.result.calories,
        protein_g: macroOutput.result.protein_g,
        carbs_g: macroOutput.result.carbs_g,
        fat_g: macroOutput.result.fat_g,
        reasoning: macroOutput.reasoning,
        is_active: true,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false });

    if (nErr) {
      console.error('Nutrition plan upsert failed:', JSON.stringify(nErr));
      return { success: false, error: `Nutrition: ${nErr.message}`, data: null };
    }
    console.log('Nutrition plan saved successfully');

    const { error: tErr } = await supabase
      .from('training_plans')
      .upsert({
        user_id: userId,
        // Include reasoning + verifications inside plan_data so TrainScreen can read them
        plan_data: {
          ...trainingOutput.result,
          reasoning: trainingOutput.reasoning,
          verifications: trainingOutput.verifications,
        },
        split_type: trainingOutput.result.split_type,
        mesocycle_week: 1,
        is_active: true,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false });

    if (tErr) {
      console.error('Training plan upsert failed:', JSON.stringify(tErr));
      return { success: false, error: `Training: ${tErr.message}`, data: null };
    }
    console.log('Training plan saved successfully');

    return {
      success: true,
      data: {
        trainingReasoning: trainingOutput.reasoning,
        splitType: trainingOutput.result.split_type,
        daysPerWeek: trainingOutput.result.days_per_week,
        calories: macroOutput.result.calories,
        proteinG: macroOutput.result.protein_g,
        carbsG: macroOutput.result.carbs_g,
        fatG: macroOutput.result.fat_g,
        macroReasoning: macroOutput.reasoning,
      } as GeneratedPlanData,
    };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}
