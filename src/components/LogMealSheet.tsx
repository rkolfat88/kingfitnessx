import React, { useState } from 'react';
import { X, Camera, Type, Loader2, Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FoodItem, IntakeEstimate, IntakeResult, IntakeTotals } from '../lib/agents/types';

// An existing food_logs row (e.g. a quiet auto-log) opened for review/edit,
// as opposed to a brand-new meal being estimated from scratch.
export interface ReviewEntry {
  logId: string;
  mealType: string;
  estimate: IntakeEstimate;
}

interface LogMealSheetProps {
  onClose: () => void;
  onLogged: () => void;
  reviewEntry?: ReviewEntry;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Mirrors intake-agent.ts's normalizePatternKey — food_logs rows don't store
// their pattern_key, so a review entry has to rederive it the same way.
function buildPatternKey(mealType: string | undefined, items: FoodItem[]): string {
  const names = items.map(i => i.name.trim().toLowerCase()).sort();
  return `${mealType ?? 'meal'}:${names.join('+')}`;
}

function sumItems(items: FoodItem[]): IntakeTotals {
  return items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + (i.kcal || 0),
      protein_g: acc.protein_g + (i.protein_g || 0),
      carbs_g: acc.carbs_g + (i.carbs_g || 0),
      fat_g: acc.fat_g + (i.fat_g || 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
}

export function LogMealSheet({ onClose, onLogged, reviewEntry }: LogMealSheetProps) {
  const [mode, setMode] = useState<'text' | 'photo'>('text');
  const [mealType, setMealType] = useState<string>(reviewEntry?.mealType ?? 'lunch');
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMediaType, setPhotoMediaType] = useState<'image/jpeg' | 'image/png' | 'image/webp' | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IntakeResult | null>(
    reviewEntry
      ? { status: 'unverified', estimate: reviewEntry.estimate, patternKey: buildPatternKey(reviewEntry.mealType, reviewEntry.estimate.items) }
      : null
  );
  const [editedTotals, setEditedTotals] = useState<IntakeTotals | null>(reviewEntry?.estimate.totals ?? null);
  const [done, setDone] = useState(false);

  const handlePhotoSelect = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPEG, PNG, or WEBP photo.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl.split(',')[1]);
      setPhotoMediaType(file.type as 'image/jpeg' | 'image/png' | 'image/webp');
    };
    reader.readAsDataURL(file);
  };

  const handleEstimate = async () => {
    setError('');
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'photo' && !photoBase64) return;

    setSubmitting(true);
    try {
      const headers = await authHeaders();
      const body =
        mode === 'photo'
          ? { mode: 'photo', imageBase64: photoBase64, mediaType: photoMediaType, mealType }
          : { mode: 'text', text, mealType };

      const res = await fetch('/api/agents/intake', { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Estimate failed');

      const intake = json as IntakeResult;
      setResult(intake);
      setEditedTotals(intake.estimate.totals);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    setDone(true);
    onLogged();
    setTimeout(onClose, 900);
  };

  const handleConfirm = async () => {
    if (!result || !editedTotals) return;
    setSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const aiTotals = result.estimate.totals;
      const changed = (Object.keys(editedTotals) as (keyof IntakeTotals)[]).some(
        k => Math.round(editedTotals[k]) !== Math.round(aiTotals[k])
      );

      if (changed) {
        const corrected: IntakeEstimate = { ...result.estimate, totals: editedTotals };
        const res = await fetch('/api/agents/intake/correct', {
          method: 'POST',
          headers,
          body: JSON.stringify({ aiEstimate: result.estimate, correctedEstimate: corrected, mealType, patternKey: result.patternKey }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Correction failed');
      } else if (reviewEntry) {
        // Unedited review of an existing auto-log — just verify the row in place.
        const res = await fetch('/api/agents/intake/verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({ logId: reviewEntry.logId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Verify failed');
      } else {
        const res = await fetch('/api/agents/intake/confirm', {
          method: 'POST',
          headers,
          body: JSON.stringify({ estimate: result.estimate, mealType, patternKey: result.patternKey }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Confirm failed');
      }
      finish();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogUsual = async () => {
    if (!result?.usualMatch) return;
    setSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const totals = sumItems(result.usualMatch.lastItems);
      const estimate: IntakeEstimate = { items: result.usualMatch.lastItems, totals, confidence_note: 'Same as usual.' };
      const res = await fetch('/api/agents/intake/confirm', {
        method: 'POST',
        headers,
        body: JSON.stringify({ estimate, mealType, patternKey: result.usualMatch.patternKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Confirm failed');
      finish();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAutoLog = async () => {
    if (!result?.logId) return;
    setSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/agents/intake/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ logId: result.logId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Verify failed');
      finish();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border-t border-[#CAFF40]/15 rounded-t-3xl max-w-[430px] w-full mx-auto max-h-[85vh] overflow-y-auto pb-8">
        <div className="w-10 h-1 bg-[#262626] rounded-full mx-auto mt-3 mb-2" />

        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-lg font-black text-[#FFFFFF]">{reviewEntry ? 'Review Meal' : 'Log a Meal'}</h2>
          <button onClick={onClose} className="text-[#5C5C5C]"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="px-5 pb-6 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#CAFF40]/15 flex items-center justify-center">
              <Check className="w-6 h-6 text-[#CAFF40]" />
            </div>
            <p className="text-sm font-semibold text-[#FFFFFF]">Logged.</p>
          </div>
        ) : !result ? (
          <div className="px-5 space-y-4">
            <div className="flex gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMealType(m)}
                  className={`flex-1 text-xs font-bold uppercase tracking-wide py-2 rounded-xl border ${mealType === m ? 'bg-[#CAFF40] text-[#000000] border-[#CAFF40]' : 'bg-[#0D0D0D] text-[#A0A0A0] border-[#262626]'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold ${mode === 'text' ? 'border-[#CAFF40]/40 text-[#CAFF40] bg-[#CAFF40]/[0.06]' : 'border-[#262626] text-[#A0A0A0]'}`}
              >
                <Type className="w-4 h-4" /> Describe
              </button>
              <button
                onClick={() => setMode('photo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold ${mode === 'photo' ? 'border-[#CAFF40]/40 text-[#CAFF40] bg-[#CAFF40]/[0.06]' : 'border-[#262626] text-[#A0A0A0]'}`}
              >
                <Camera className="w-4 h-4" /> Photo
              </button>
            </div>

            {mode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`e.g. "grilled chicken breast, rice, and broccoli" or "same as yesterday's lunch"`}
                className="w-full h-24 bg-[#0D0D0D] border border-[#262626] rounded-2xl p-4 text-sm text-[#FFFFFF] placeholder:text-[#5C5C5C] resize-none focus:outline-none focus:border-[#CAFF40]/40"
              />
            ) : (
              <label className="flex flex-col items-center justify-center h-32 bg-[#0D0D0D] border border-dashed border-[#333333] rounded-2xl cursor-pointer overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Meal preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-[#5C5C5C] mb-1" />
                    <span className="text-xs text-[#5C5C5C]">Tap to choose a photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
                />
              </label>
            )}

            {error && <p className="text-xs text-[#EF4444]">{error}</p>}

            <button
              onClick={handleEstimate}
              disabled={submitting || (mode === 'text' ? !text.trim() : !photoBase64)}
              className="w-full bg-[#CAFF40] text-[#000000] font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Estimate
            </button>
          </div>
        ) : (
          <div className="px-5 space-y-4">
            {reviewEntry && (
              <p className="text-xs font-bold uppercase tracking-widest text-[#CAFF40] capitalize">{mealType}</p>
            )}
            <p className="text-xs text-[#A0A0A0]">{result.estimate.confidence_note}</p>

            {result.status === 'auto_logged' && (
              <div className="bg-[#CAFF40]/[0.06] border border-[#CAFF40]/20 rounded-2xl p-4 space-y-2">
                <p className="text-sm text-[#FFFFFF]">
                  Logged automatically based on your usual pattern. It'll auto-confirm in 48h, or tap below now.
                </p>
                <button
                  onClick={handleConfirmAutoLog}
                  disabled={submitting}
                  className="w-full bg-[#CAFF40] text-[#000000] font-black rounded-xl py-2.5 text-sm disabled:opacity-50"
                >
                  {submitting ? 'Confirming…' : 'Confirm now'}
                </button>
              </div>
            )}

            {result.status === 'usual_suggested' && result.usualMatch && (
              <div className="bg-[#CAFF40]/[0.06] border border-[#CAFF40]/20 rounded-2xl p-4 space-y-2">
                <p className="text-sm text-[#FFFFFF]">Same as your usual "{result.usualMatch.patternKey.split(':')[1]}"?</p>
                <button
                  onClick={handleLogUsual}
                  disabled={submitting}
                  className="w-full bg-[#CAFF40] text-[#000000] font-black rounded-xl py-2.5 text-sm disabled:opacity-50"
                >
                  {submitting ? 'Logging…' : 'Yes, log my usual'}
                </button>
              </div>
            )}

            {result.status !== 'auto_logged' && (
              <>
                <div className="space-y-1.5">
                  {result.estimate.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#FFFFFF]">{item.name} <span className="text-[#5C5C5C]">({item.est_qty})</span></span>
                      <span className="text-[#A0A0A0] font-mono">{Math.round(item.kcal)} kcal</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['kcal', 'protein_g', 'carbs_g', 'fat_g'] as (keyof IntakeTotals)[]).map(key => (
                    <div key={key}>
                      <label className="text-[10px] uppercase text-[#5C5C5C] font-bold">{key === 'kcal' ? 'kcal' : key.replace('_g', '')}</label>
                      <input
                        type="number"
                        value={editedTotals ? Math.round(editedTotals[key]) : 0}
                        onChange={e => setEditedTotals(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)}
                        className="w-full bg-[#0D0D0D] border border-[#262626] rounded-lg px-2 py-1.5 text-sm text-[#FFFFFF] font-mono focus:outline-none focus:border-[#CAFF40]/40"
                      />
                    </div>
                  ))}
                </div>

                {error && <p className="text-xs text-[#EF4444]">{error}</p>}

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full bg-[#CAFF40] text-[#000000] font-black rounded-2xl py-3.5 disabled:opacity-50"
                >
                  {submitting ? 'Logging…' : 'Confirm log'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
