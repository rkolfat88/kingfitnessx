// Intake agent — turns a photo or free-text description of a meal into a
// structured food log. Calls claude-sonnet-5 (vision for photos, text
// otherwise); everything else — history lookups, personal food memory,
// confidence-gated auto-log — is deterministic code around that one call.
import type { SupabaseClient } from '@supabase/supabase-js';
import type Anthropic from '@anthropic-ai/sdk';
import { getLocalDateString } from '../date';
import type {
  FoodItem,
  IntakeEstimate,
  IntakeInput,
  IntakeResult,
  AgentMemoryPattern,
} from './types';

const AUTO_LOG_MIN_CONFIRMATIONS = 5;
const AUTO_LOG_MAX_VARIANCE = 0.10;
const AUTO_VERIFY_AFTER_HOURS = 48;

const INTAKE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          est_qty: { type: 'string' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
        required: ['name', 'est_qty', 'kcal', 'protein_g', 'carbs_g', 'fat_g'],
        additionalProperties: false,
      },
    },
    totals: {
      type: 'object',
      properties: {
        kcal: { type: 'number' },
        protein_g: { type: 'number' },
        carbs_g: { type: 'number' },
        fat_g: { type: 'number' },
      },
      required: ['kcal', 'protein_g', 'carbs_g', 'fat_g'],
      additionalProperties: false,
    },
    confidence_note: { type: 'string' },
  },
  required: ['items', 'totals', 'confidence_note'],
  additionalProperties: false,
} as const;

function normalizePatternKey(mealType: string | undefined, items: FoodItem[]): string {
  const names = items.map(i => i.name.trim().toLowerCase()).sort();
  return `${mealType ?? 'meal'}:${names.join('+')}`;
}

// "same as yesterday's lunch" / "same as today's dinner" / "my usual lunch"
function detectHistoryReference(text: string): { date: string; mealType: string } | null {
  const lower = text.toLowerCase();
  const meal = /(breakfast|lunch|dinner|snack)/.exec(lower)?.[1];
  if (!meal) return null;

  if (/\byesterday\b/.test(lower)) return { date: getLocalDateString(-1), mealType: meal };
  if (/\btoday\b/.test(lower)) return { date: getLocalDateString(0), mealType: meal };
  return null;
}

async function fetchLoggedMeal(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  mealType: string
): Promise<{ items: FoodItem[]; totals: IntakeEstimate['totals'] } | null> {
  const { data } = await supabase
    .from('food_logs')
    .select('items, kcal, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .eq('meal_type', mealType)
    .gte('logged_at', `${date}T00:00:00`)
    .lt('logged_at', `${date}T23:59:59.999`)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    items: (data.items ?? []) as FoodItem[],
    totals: { kcal: data.kcal, protein_g: data.protein_g, carbs_g: data.carbs_g, fat_g: data.fat_g },
  };
}

// Best-effort match against this user's remembered patterns — simple token
// overlap, not embeddings. Good enough to power a "your usual?" shortcut.
function findUsualMatch(text: string, patterns: AgentMemoryPattern[]): AgentMemoryPattern | null {
  const lower = text.toLowerCase();
  let best: AgentMemoryPattern | null = null;
  let bestScore = 0;
  for (const p of patterns) {
    const tokens = p.pattern_key.split(':')[1]?.split('+') ?? [];
    if (tokens.length === 0) continue;
    const hits = tokens.filter(t => lower.includes(t)).length;
    const score = hits / tokens.length;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 0.6 ? best : null;
}

async function fetchAgentMemory(supabase: SupabaseClient, userId: string): Promise<AgentMemoryPattern[]> {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('id, user_id, pattern_key, pattern_data, confirm_count, correction_variance, last_seen_at')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as AgentMemoryPattern[];
}

function memoryBiasBlock(patterns: AgentMemoryPattern[]): string {
  if (patterns.length === 0) return '';
  const lines = patterns.slice(0, 5).map(p => {
    const t = p.pattern_data?.totals;
    return t ? `- "${p.pattern_key.split(':')[1]}" usually totals ${t.kcal} kcal / ${t.protein_g}p / ${t.carbs_g}c / ${t.fat_g}f` : null;
  }).filter(Boolean);
  if (lines.length === 0) return '';
  return `\n\nThis user's typical logged meals (bias your portion estimate toward these when the description matches):\n${lines.join('\n')}`;
}

async function callIntakeModel(anthropic: Anthropic, input: IntakeInput, biasContext: string): Promise<IntakeEstimate> {
  const instructions = `Estimate the nutritional content of the described meal. Handle vague quantities ("a sandwich") by assuming a typical serving. Return strict JSON matching the schema — no prose outside the JSON.${biasContext}`;

  const content: Anthropic.MessageParam['content'] =
    input.mode === 'photo'
      ? [
          { type: 'image', source: { type: 'base64', media_type: input.mediaType, data: input.imageBase64 } },
          { type: 'text', text: instructions },
        ]
      : `${instructions}\n\nMeal description: ${input.text}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    output_config: { format: { type: 'json_schema', schema: INTAKE_SCHEMA } },
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Intake model returned no text content');
  }
  return JSON.parse(textBlock.text) as IntakeEstimate;
}

export async function estimateIntake(
  anthropic: Anthropic,
  supabase: SupabaseClient,
  userId: string,
  input: IntakeInput,
  mealType?: string
): Promise<IntakeResult> {
  // History reference ("same as yesterday's lunch") — skip the model entirely.
  if (input.mode === 'text') {
    const ref = detectHistoryReference(input.text);
    if (ref) {
      const logged = await fetchLoggedMeal(supabase, userId, ref.date, ref.mealType);
      if (logged) {
        const estimate: IntakeEstimate = {
          items: logged.items,
          totals: logged.totals,
          confidence_note: `Reused from your ${ref.date} ${ref.mealType} log.`,
        };
        const patternKey = normalizePatternKey(ref.mealType, logged.items);
        return finalizeEstimate(supabase, userId, estimate, patternKey);
      }
    }
  }

  const patterns = await fetchAgentMemory(supabase, userId);
  const usualMatch = input.mode === 'text' ? findUsualMatch(input.text, patterns) : null;

  const estimate = await callIntakeModel(anthropic, input, memoryBiasBlock(patterns));
  const patternKey = normalizePatternKey(mealType, estimate.items);

  const result = await finalizeEstimate(supabase, userId, estimate, patternKey);
  if (usualMatch) {
    result.status = 'usual_suggested';
    result.usualMatch = { patternKey: usualMatch.pattern_key, lastItems: usualMatch.pattern_data.items };
  }
  return result;
}

// Decides auto-log eligibility for this pattern and writes to food_logs
// accordingly. Confidence-gated auto-log is the sanctioned exception to the
// [VERIFY] rule — everything else returns unverified until explicit confirm.
async function finalizeEstimate(
  supabase: SupabaseClient,
  userId: string,
  estimate: IntakeEstimate,
  patternKey: string
): Promise<IntakeResult> {
  const { data: existing } = await supabase
    .from('agent_memory')
    .select('confirm_count, correction_variance')
    .eq('user_id', userId)
    .eq('pattern_key', patternKey)
    .maybeSingle();

  const eligible =
    !!existing &&
    existing.confirm_count >= AUTO_LOG_MIN_CONFIRMATIONS &&
    existing.correction_variance < AUTO_LOG_MAX_VARIANCE;

  if (!eligible) {
    return { status: 'unverified', estimate, patternKey };
  }

  const { data: inserted, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      logged_at: new Date().toISOString(),
      items: estimate.items,
      kcal: estimate.totals.kcal,
      protein_g: estimate.totals.protein_g,
      carbs_g: estimate.totals.carbs_g,
      fat_g: estimate.totals.fat_g,
      confidence_note: estimate.confidence_note,
      source: 'auto',
      verified: false,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('auto-log insert failed, falling back to unverified:', error.message);
    return { status: 'unverified', estimate, patternKey };
  }

  return { status: 'auto_logged', estimate, patternKey, logId: inserted.id };
}

async function upsertAgentMemory(
  supabase: SupabaseClient,
  userId: string,
  patternKey: string,
  estimate: IntakeEstimate,
  varianceSample: number | null
): Promise<void> {
  const { data: existing } = await supabase
    .from('agent_memory')
    .select('id, confirm_count, correction_variance')
    .eq('user_id', userId)
    .eq('pattern_key', patternKey)
    .maybeSingle();

  if (!existing) {
    await supabase.from('agent_memory').insert({
      user_id: userId,
      pattern_key: patternKey,
      pattern_data: { items: estimate.items, totals: estimate.totals },
      confirm_count: 1,
      correction_variance: varianceSample ?? 0,
      last_seen_at: new Date().toISOString(),
    });
    return;
  }

  // No edit this time → nudge variance down (evidence the estimate was accurate).
  // An edit → blend the new variance sample in, weighted toward recent history.
  const nextVariance =
    varianceSample == null
      ? existing.correction_variance * 0.8
      : existing.correction_variance * 0.5 + varianceSample * 0.5;

  await supabase
    .from('agent_memory')
    .update({
      pattern_data: { items: estimate.items, totals: estimate.totals },
      confirm_count: existing.confirm_count + 1,
      correction_variance: nextVariance,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
}

// Explicit user confirmation — the standard path for anything not auto-logged.
export async function confirmIntake(
  supabase: SupabaseClient,
  userId: string,
  estimate: IntakeEstimate,
  mealType: string | undefined,
  patternKey: string
): Promise<string> {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      logged_at: new Date().toISOString(),
      meal_type: mealType,
      items: estimate.items,
      kcal: estimate.totals.kcal,
      protein_g: estimate.totals.protein_g,
      carbs_g: estimate.totals.carbs_g,
      fat_g: estimate.totals.fat_g,
      confidence_note: estimate.confidence_note,
      source: 'manual',
      verified: true,
    })
    .select('id')
    .single();

  if (error) throw new Error(`confirmIntake failed: ${error.message}`);

  await upsertAgentMemory(supabase, userId, patternKey, estimate, null);
  return data.id;
}

// User edited the AI estimate before confirming — logs the correction so
// agent_memory's variance reflects it (can revoke auto-log eligibility).
export async function correctIntake(
  supabase: SupabaseClient,
  userId: string,
  aiEstimate: IntakeEstimate,
  correctedEstimate: IntakeEstimate,
  mealType: string | undefined,
  patternKey: string
): Promise<string> {
  const variance =
    aiEstimate.totals.kcal > 0
      ? Math.abs(correctedEstimate.totals.kcal - aiEstimate.totals.kcal) / aiEstimate.totals.kcal
      : 0;

  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      logged_at: new Date().toISOString(),
      meal_type: mealType,
      items: correctedEstimate.items,
      kcal: correctedEstimate.totals.kcal,
      protein_g: correctedEstimate.totals.protein_g,
      carbs_g: correctedEstimate.totals.carbs_g,
      fat_g: correctedEstimate.totals.fat_g,
      confidence_note: correctedEstimate.confidence_note,
      source: 'manual',
      verified: true,
    })
    .select('id')
    .single();

  if (error) throw new Error(`correctIntake failed: ${error.message}`);

  await upsertAgentMemory(supabase, userId, patternKey, correctedEstimate, variance);
  return data.id;
}

// Tap-to-verify on a quiet auto-log review card.
export async function verifyAutoLog(supabase: SupabaseClient, userId: string, logId: string): Promise<void> {
  const { data: log } = await supabase
    .from('food_logs')
    .select('items, kcal, protein_g, carbs_g, fat_g')
    .eq('id', logId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!log) return;

  await supabase.from('food_logs').update({ verified: true }).eq('id', logId).eq('user_id', userId);

  const estimate: IntakeEstimate = {
    items: (log.items ?? []) as FoodItem[],
    totals: { kcal: log.kcal, protein_g: log.protein_g, carbs_g: log.carbs_g, fat_g: log.fat_g },
    confidence_note: '',
  };
  const patternKey = normalizePatternKey(undefined, estimate.items);
  await upsertAgentMemory(supabase, userId, patternKey, estimate, null);
}

// 48h-no-edit auto-verify sweep. Call opportunistically (e.g. once per intake
// request) rather than standing up a dedicated scheduler for this alone.
export async function sweepStaleAutoLogs(supabase: SupabaseClient, userId: string): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_VERIFY_AFTER_HOURS * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from('food_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'auto')
    .eq('verified', false)
    .lt('logged_at', cutoff);

  if (!stale || stale.length === 0) return 0;
  for (const row of stale) {
    await verifyAutoLog(supabase, userId, row.id);
  }
  return stale.length;
}
