// The complete input profile for any client
export interface ClientProfile {
  // Physical (from onboarding)
  age: number;
  gender: 'male' | 'female' | 'other';
  weight_kg: number;
  height_cm: number;
  goal: 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance';
  experience: 'beginner' | 'intermediate' | 'advanced';
  days_per_week: number;
  equipment: 'gym' | 'home' | 'both';
  injuries: string[];

  // Psychological (from Phase Zero)
  psychological_stage: 'precontemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  identity_statement: string;
  fears: string[];
  energy_window: 'morning' | 'midday' | 'afternoon' | 'evening';
  motivation_baseline: number; // 1-10

  // Nutrition preferences
  protocol: 'standard' | 'high_protein' | 'carnivore' | 'glp1';
  allergies: string[];
}

export interface DailyState {
  motivation: number;    // 1-10
  energy: number;        // 1-10
  soreness: number;      // 1-10
  sleep_hours: number;
  mood: number;          // 1-10
}

// Every engine output carries its reasoning
export interface EngineOutput<T> {
  result: T;
  reasoning: string[];   // the "show the math" lines
  flags: string[];       // any special conditions triggered
}

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rpe: number;
  rest_seconds: number;
  notes: string;
}

export interface TrainingDay {
  day_name: string;
  focus: string;
  duration_min: number;
  exercises: Exercise[];
  notes?: string;
}

export interface TrainingPlan {
  split_type: string;
  days_per_week: number;
  mesocycle_week: number;
  days: TrainingDay[];
  notes: string;
}
