-- Add training_readiness and recovery_risk to performance_scores
ALTER TABLE public.performance_scores
  ADD COLUMN IF NOT EXISTS training_readiness INTEGER CHECK (training_readiness BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS recovery_risk INTEGER CHECK (recovery_risk BETWEEN 0 AND 100);
