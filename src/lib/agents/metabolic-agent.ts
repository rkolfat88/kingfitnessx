// Metabolic agent — explains adaptive-tdee's output in plain language.
// It never calculates anything; all math stays in coaching-rules/adaptive-tdee.ts.
// This is purely a wording layer over an already-computed metabolic_state.
import type Anthropic from '@anthropic-ai/sdk';
import type { MetabolicState } from '../coaching-rules/adaptive-tdee';

const METABOLIC_SYSTEM = `You are Coach Richard K.'s metabolic explainer inside KFX.
You explain an already-computed metabolic state to the athlete in 1-3 plain sentences.
You never calculate anything yourself — only restate the numbers and delta you're given.
Direct, confident, no emojis, no markdown. If confidence is 0, say the targets are still the onboarding estimate and why.`;

export async function explainMetabolicState(anthropic: Anthropic, state: MetabolicState): Promise<string> {
  const prompt = `metabolic_state: estimated_tdee=${state.estimated_tdee} kcal, confidence=${Math.round(state.confidence * 100)}%, data_days=${state.data_days}, trend_weight_kg=${state.trend_weight_kg ?? 'unknown'}.
Latest delta: ${state.delta_explanation}

Write the coaching note now.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 200,
    thinking: { type: 'disabled' },
    system: METABOLIC_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : state.delta_explanation;
}
