import type { ClientProfile, MacroTargets, EngineOutput } from './types';

// Lean body mass estimate (no DEXA, use formula)
function estimateLeanMass(profile: ClientProfile): number {
  // Boer formula approximation for lean mass
  const { weight_kg, height_cm, gender } = profile;
  if (gender === 'male') {
    return 0.407 * weight_kg + 0.267 * height_cm - 19.2;
  }
  return 0.252 * weight_kg + 0.473 * height_cm - 48.3;
}

// Mifflin-St Jeor BMR
function calculateBMR(profile: ClientProfile): number {
  const { weight_kg, height_cm, age, gender } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function activityMultiplier(daysPerWeek: number): number {
  if (daysPerWeek <= 2) return 1.375;
  if (daysPerWeek <= 4) return 1.55;
  return 1.725;
}

export function calculateMacros(profile: ClientProfile): EngineOutput<MacroTargets> {
  const reasoning: string[] = [];
  const flags: string[] = [];

  const leanMass = estimateLeanMass(profile);
  const bmr = calculateBMR(profile);
  const tdee = bmr * activityMultiplier(profile.days_per_week);

  reasoning.push(`Estimated lean mass: ${leanMass.toFixed(1)}kg`);
  reasoning.push(`BMR (Mifflin-St Jeor): ${Math.round(bmr)} cal`);
  reasoning.push(`TDEE (×${activityMultiplier(profile.days_per_week)} for ${profile.days_per_week} days/week): ${Math.round(tdee)} cal`);

  // Goal-based calorie adjustment
  let calories = tdee;
  if (profile.goal === 'fat_loss') {
    calories = tdee - 500;
    reasoning.push(`Fat loss goal: −500 cal deficit → ${Math.round(calories)} cal`);
  } else if (profile.goal === 'muscle_gain') {
    calories = tdee + 300;
    reasoning.push(`Muscle gain goal: +300 cal surplus → ${Math.round(calories)} cal`);
  } else if (profile.goal === 'recomp') {
    calories = tdee;
    reasoning.push(`Recomp goal: maintenance calories → ${Math.round(calories)} cal`);
  } else {
    reasoning.push(`Maintenance goal: TDEE → ${Math.round(calories)} cal`);
  }

  // PROTEIN LOCKED at 2.2g per kg lean mass
  let protein_g = Math.round(leanMass * 2.2);
  reasoning.push(`Protein LOCKED at 2.2g × ${leanMass.toFixed(1)}kg lean mass = ${protein_g}g [non-negotiable]`);

  // GLP-1 users get even higher protein for muscle preservation
  if (profile.protocol === 'glp1') {
    protein_g = Math.round(leanMass * 2.4);
    reasoning.push(`GLP-1 protocol: protein raised to 2.4g/kg = ${protein_g}g (muscle preservation priority)`);
    flags.push('glp1_muscle_preservation');
  }

  // Fat: carnivore = high fat, others = moderate
  let fat_g: number;
  if (profile.protocol === 'carnivore') {
    // Carnivore: fat is the primary energy source
    const proteinCals = protein_g * 4;
    const remainingCals = calories - proteinCals;
    fat_g = Math.round(remainingCals / 9);
    reasoning.push(`Carnivore protocol: fat fills remaining ${Math.round(remainingCals)} cal = ${fat_g}g`);
    const carbs_g = 0;
    reasoning.push(`Carnivore protocol: carbs = 0g`);
    return {
      result: { calories: Math.round(calories), protein_g, carbs_g, fat_g },
      reasoning,
      flags,
    };
  } else {
    // Standard: fat at 0.8g/kg bodyweight
    fat_g = Math.round(profile.weight_kg * 0.8);
    reasoning.push(`Fat at 0.8g × ${profile.weight_kg}kg bodyweight = ${fat_g}g`);
  }

  // Carbs fill the remainder
  const proteinCals = protein_g * 4;
  const fatCals = fat_g * 9;
  const carbs_g = Math.max(0, Math.round((calories - proteinCals - fatCals) / 4));
  reasoning.push(`Carbs fill remainder: (${Math.round(calories)} − ${proteinCals} − ${fatCals}) ÷ 4 = ${carbs_g}g`);

  return {
    result: { calories: Math.round(calories), protein_g, carbs_g, fat_g },
    reasoning,
    flags,
  };
}
