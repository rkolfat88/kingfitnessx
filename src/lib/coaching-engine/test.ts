import { calculateMacros, buildTrainingPlan } from './index';
import type { ClientProfile } from './types';

const testClient: ClientProfile = {
  age: 32, gender: 'male', weight_kg: 85, height_cm: 180,
  goal: 'fat_loss', experience: 'intermediate', days_per_week: 4,
  equipment: 'gym', injuries: ['knee'],
  psychological_stage: 'preparation', identity_statement: 'Someone who shows up',
  fears: ['Getting injured again'], energy_window: 'evening', motivation_baseline: 7,
  protocol: 'high_protein', allergies: [],
};

console.log('=== MACROS ===');
const macros = calculateMacros(testClient);
console.log(macros.result);
macros.reasoning.forEach(r => console.log('  →', r));

console.log('\n=== TRAINING ===');
const plan = buildTrainingPlan(testClient);
console.log('Split:', plan.result.split_type);
plan.reasoning.forEach(r => console.log('  →', r));
plan.result.days.forEach(d => {
  console.log(`\n${d.day_name} — ${d.focus} (${d.duration_min}min)`);
  d.exercises.forEach(e => console.log(`  ${e.name}: ${e.sets}×${e.reps} @RPE${e.rpe}`));
});
