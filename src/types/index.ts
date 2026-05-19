export type Goal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export type TrainingLocation = 'gym' | 'home' | 'both'
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced'
export type AgentType = 'workout' | 'nutrition' | 'recovery' | 'accountability' | 'analysis' | 'general'
export type SubscriptionTier = 'free' | 'pro'

export interface UserProfile {
  id: string
  full_name: string | null
  subscription_tier: SubscriptionTier
  stripe_customer_id: string | null
  subscription_status: string | null
  subscription_end_date: string | null
  onboarding_completed: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface OnboardingData {
  id: string
  user_id: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  goal: Goal
  activity_level: ActivityLevel
  training_location: TrainingLocation
  training_experience: TrainingExperience
  days_per_week: number
  allergies: string[]
  food_preferences: string[]
  fasting_preference: string | null
}

export interface WorkoutPlan {
  id: string
  user_id: string
  plan_data: WorkoutPlanData
  week_number: number
  is_active: boolean
  generated_at: string
}

export interface WorkoutPlanData {
  split: string
  days_per_week: number
  sessions: WorkoutSession[]
  notes: string
}

export interface WorkoutSession {
  day: string
  muscle_groups: string[]
  exercises: Exercise[]
  duration_minutes: number
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
}

export interface NutritionPlan {
  id: string
  user_id: string
  plan_data: NutritionPlanData
  is_active: boolean
  generated_at: string
}

export interface NutritionPlanData {
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  meals: Meal[]
  notes: string
}

export interface Meal {
  name: string
  time: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  foods: string[]
}

export interface DailyCheckin {
  id: string
  user_id: string
  date: string
  weight_kg: number | null
  energy_level: number
  soreness_level: number
  adherence_workout: boolean
  adherence_nutrition: boolean
  mood: number
  notes: string | null
  ai_response: CheckinAIResponse | null
}

export interface CheckinAIResponse {
  message: string
  adjustments: string[]
  motivation: string
}

export interface ProgressLog {
  id: string
  user_id: string
  log_date: string
  weight_kg: number | null
  photo_url: string | null
  notes: string | null
}

export interface ExpandedScores {
  recovery_score: number
  training_readiness: number
  adherence_score: number
  stress_load: number
  momentum_score: number
  discipline_rating: number
  fat_loss_velocity: number
  recovery_risk: number
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  agent_type?: AgentType
  created_at?: string
}

export interface NutritionCardData {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  meals: Array<{
    name: string
    time: string
    calories: number
    foods: string[]
  }>
  protocol?: string
  notes?: string
}

export interface WorkoutCardData {
  focus: string
  total_sets: number
  duration_minutes: number
  exercises: Array<{
    name: string
    sets: number
    reps: string
    rpe?: number
    rest_seconds?: number
    notes?: string
  }>
}

export interface ScoreCardData {
  scores: Array<{
    label: string
    value: number
    color: string
  }>
  summary: string
}

export interface DirectiveCardData {
  directives: string[]
  severity: 'info' | 'warning' | 'critical'
  action: string
}

export interface AgentResponsePayload {
  textFallback: string
  displayType: 'TEXT' | 'NUTRITION_CARD' | 'WORKOUT_CARD' | 'SCORE_CARD' | 'CHECKIN_CARD' | 'DIRECTIVE_CARD'
  data?: NutritionCardData | WorkoutCardData | ScoreCardData | DirectiveCardData | null
}
