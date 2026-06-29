-- ================================================================
-- KFX Complete Schema Migration v1
-- Generated from codebase audit against pdctqjrcsuldbgsijqpb
-- Apply via: Supabase Dashboard → SQL Editor, or psql with DATABASE_URL
-- ================================================================

-- ── onboarding_data (table exists, 5 columns missing) ─────────────
ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS experience           text,
  ADD COLUMN IF NOT EXISTS equipment            text,
  ADD COLUMN IF NOT EXISTS injuries             text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS protocol             text,
  ADD COLUMN IF NOT EXISTS allergies            text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean   DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.onboarding_data'::regclass AND contype = 'u'
      AND array_to_string(conkey, ',') = (
        SELECT array_to_string(ARRAY[attnum::int], ',')
        FROM pg_attribute WHERE attrelid = 'public.onboarding_data'::regclass AND attname = 'user_id'
      )
  ) THEN
    ALTER TABLE public.onboarding_data ADD CONSTRAINT onboarding_data_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ── mind_profiles (table missing) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mind_profiles (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_zero_completed boolean     DEFAULT false,
  phase_zero_day       integer     DEFAULT 1,
  psychological_stage  text        DEFAULT 'preparation',
  identity_statement   text,
  fear_audit           text[]      DEFAULT '{}',
  energy_peak_window   text        DEFAULT 'evening',
  quit_signals         jsonb,
  mind_score           integer     DEFAULT 0,
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.mind_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own mind_profiles"
  ON public.mind_profiles FOR ALL USING (auth.uid() = user_id);

-- ── nutrition_plans (table exists, 6 columns missing) ─────────────
ALTER TABLE public.nutrition_plans
  ADD COLUMN IF NOT EXISTS protocol       text,
  ADD COLUMN IF NOT EXISTS daily_calories integer,
  ADD COLUMN IF NOT EXISTS protein_g      integer,
  ADD COLUMN IF NOT EXISTS carbs_g        integer,
  ADD COLUMN IF NOT EXISTS fat_g          integer,
  ADD COLUMN IF NOT EXISTS reasoning      text[];

ALTER TABLE public.nutrition_plans
  ADD CONSTRAINT IF NOT EXISTS nutrition_plans_user_id_key UNIQUE (user_id);

-- ── training_plans (table missing) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_plans (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data      jsonb,
  split_type     text,
  mesocycle_week integer     DEFAULT 1,
  is_active      boolean     DEFAULT true,
  generated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own training_plans"
  ON public.training_plans FOR ALL USING (auth.uid() = user_id);

-- ── daily_checkins (table exists, 9 columns missing) ──────────────
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS checkin_date         date,
  ADD COLUMN IF NOT EXISTS sleep_quality        integer,
  ADD COLUMN IF NOT EXISTS energy               integer,
  ADD COLUMN IF NOT EXISTS soreness             integer,
  ADD COLUMN IF NOT EXISTS adapted_session      jsonb,
  ADD COLUMN IF NOT EXISTS adaptation_reasoning text[],
  ADD COLUMN IF NOT EXISTS adaptation_flags     text[],
  ADD COLUMN IF NOT EXISTS counterfactual       text,
  ADD COLUMN IF NOT EXISTS completed            boolean DEFAULT false;

ALTER TABLE public.daily_checkins
  ADD CONSTRAINT IF NOT EXISTS daily_checkins_user_date_key UNIQUE (user_id, checkin_date);

-- ── protocol_streaks (table missing) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocol_streaks (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak         integer     DEFAULT 0,
  longest_streak         integer     DEFAULT 0,
  last_checkin_date      date,
  total_days_on_protocol integer     DEFAULT 0,
  updated_at             timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.protocol_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own protocol_streaks"
  ON public.protocol_streaks FOR ALL USING (auth.uid() = user_id);

-- ── user_profiles (table exists, 3 columns missing) ───────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS user_id  uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ── mind_checkins (table missing) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mind_checkins (
  id           uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date    DEFAULT CURRENT_DATE,
  motivation   integer,
  mood         integer,
  notes        text,
  UNIQUE(user_id, checkin_date)
);
ALTER TABLE public.mind_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own mind_checkins"
  ON public.mind_checkins FOR ALL USING (auth.uid() = user_id);

-- ── phase_zero_progress (table missing) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.phase_zero_progress (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_day    integer     DEFAULT 1,
  completed_days integer[]   DEFAULT '{}',
  started_at     timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.phase_zero_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own phase_zero_progress"
  ON public.phase_zero_progress FOR ALL USING (auth.uid() = user_id);

-- ── weekly_debriefs (table missing) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_debriefs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start   date,
  debrief_data jsonb,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.weekly_debriefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own weekly_debriefs"
  ON public.weekly_debriefs FOR ALL USING (auth.uid() = user_id);

-- ── workout_logs (table missing) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at        timestamptz DEFAULT now(),
  training_plan_id uuid,
  exercises_logged jsonb
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own workout_logs"
  ON public.workout_logs FOR ALL USING (auth.uid() = user_id);

-- ── performance_scores (table missing) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.performance_scores (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scored_at  timestamptz DEFAULT now(),
  recovery   integer,
  readiness  integer,
  adherence  integer,
  momentum   integer,
  discipline integer,
  mind       integer
);
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own performance_scores"
  ON public.performance_scores FOR ALL USING (auth.uid() = user_id);

-- ── insights (table missing) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.insights (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  observation    text,
  evidence       jsonb,
  interpretation text,
  action         text
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own insights"
  ON public.insights FOR ALL USING (auth.uid() = user_id);
