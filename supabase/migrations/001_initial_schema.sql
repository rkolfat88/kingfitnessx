-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding data
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  goal TEXT CHECK (goal IN ('fat_loss', 'muscle_gain', 'recomp', 'maintenance')),
  activity_level TEXT CHECK (activity_level IN ('sedentary','lightly_active','moderately_active','very_active')),
  training_location TEXT CHECK (training_location IN ('gym','home','both')),
  training_experience TEXT CHECK (training_experience IN ('beginner','intermediate','advanced')),
  days_per_week INTEGER,
  allergies TEXT[] DEFAULT '{}',
  food_preferences TEXT[] DEFAULT '{}',
  fasting_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout plans
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  week_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  adapted_from UUID REFERENCES public.workout_plans(id)
);

-- Nutrition plans
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  adapted_from UUID REFERENCES public.nutrition_plans(id)
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_kg NUMERIC,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  soreness_level INTEGER CHECK (soreness_level BETWEEN 1 AND 10),
  adherence_workout BOOLEAN DEFAULT FALSE,
  adherence_nutrition BOOLEAN DEFAULT FALSE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  notes TEXT,
  ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Progress logs
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  weight_kg NUMERIC,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation history
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own onboarding" ON public.onboarding_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workouts" ON public.workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nutrition" ON public.nutrition_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own checkins" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON public.progress_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON public.conversation_history FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user ON public.conversation_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON public.workout_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_active ON public.nutrition_plans(user_id, is_active);
