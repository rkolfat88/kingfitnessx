-- Performance scores table
CREATE TABLE IF NOT EXISTS public.performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score_date DATE NOT NULL,
  recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
  adherence_score INTEGER CHECK (adherence_score BETWEEN 0 AND 100),
  momentum_score INTEGER CHECK (momentum_score BETWEEN 0 AND 100),
  stress_load INTEGER CHECK (stress_load BETWEEN 0 AND 100),
  discipline_rating INTEGER CHECK (discipline_rating BETWEEN 0 AND 100),
  fat_loss_velocity NUMERIC,
  readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, score_date)
);

-- Intelligence alerts table
CREATE TABLE IF NOT EXISTS public.intelligence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'plateau_detected',
    'overtraining_risk',
    'burnout_risk',
    'low_adherence_trend',
    'recovery_debt',
    'momentum_building',
    'streak_milestone',
    'goal_on_track',
    'calorie_adaptation',
    'stress_spike'
  )),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'positive')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_suggestion TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their performance scores"
  ON public.performance_scores FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their intelligence alerts"
  ON public.intelligence_alerts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_performance_scores_user_date
  ON public.performance_scores(user_id, score_date);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_user
  ON public.intelligence_alerts(user_id, is_read, created_at);
