export type ScreenId =
  | 'mind'
  | 'dashboard'
  | 'form-analysis'
  | 'coach-chat'
  | 'onboarding'
  | 'timeline'
  | 'active-workout'
  | 'nutrition'
  | 'progress'
  | 'paywall'
  | 'settings';

export interface Message {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
}

export interface OnboardingState {
  step: number;
  goal: string;
  experience: string;
  equipment: string;
  daysPerWeek: number;
  injuries: string;
  isCompleted: boolean;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  currentSetIndex: number;
  targetReps: string;
  suggestedWeight: string;
  tips: string;
  videoUrl?: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface WearableStats {
  whoopHrv: number;
  whoopReadiness: number;
  ouraSleepScore: number;
  appleWatchAvgHr: number;
  lastSynced: string;
}
