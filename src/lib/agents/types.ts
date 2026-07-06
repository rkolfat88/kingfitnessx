// Shared types for the agent pipeline (intake-agent, metabolic-agent, orchestrator).
// These modules call the Anthropic API and read/write Supabase directly — unlike
// src/lib/coaching-engine, which stays pure TypeScript with zero I/O.

export interface FoodItem {
  name: string;
  est_qty: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface IntakeTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface IntakeEstimate {
  items: FoodItem[];
  totals: IntakeTotals;
  confidence_note: string;
}

export type IntakeInput =
  | { mode: 'photo'; imageBase64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }
  | { mode: 'text'; text: string };

export interface IntakeResult {
  status: 'auto_logged' | 'unverified' | 'usual_suggested';
  estimate: IntakeEstimate;
  logId?: string;
  patternKey: string;
  usualMatch?: { patternKey: string; lastItems: FoodItem[] } | null;
}

export interface AgentMemoryPattern {
  id: string;
  user_id: string;
  pattern_key: string;
  pattern_data: { items: FoodItem[]; totals: IntakeTotals };
  confirm_count: number;
  correction_variance: number;
  last_seen_at: string;
}

export interface OrchestratorIntakeResponse {
  intake: IntakeResult;
  metabolicNote: string | null;
  flags: string[];
}
