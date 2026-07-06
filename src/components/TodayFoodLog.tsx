import React, { useEffect, useState, useCallback } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateString } from '../lib/date';
import { LogMealSheet } from './LogMealSheet';
import type { FoodItem } from '../lib/agents/types';

interface FoodLogRow {
  id: string;
  logged_at: string;
  meal_type: string | null;
  items: FoodItem[] | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_note: string | null;
  source: string;
  verified: boolean;
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export function TodayFoodLog({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<FoodLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRow, setReviewRow] = useState<FoodLogRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const today = getLocalDateString();
    const { data } = await supabase
      .from('food_logs')
      .select('id, logged_at, meal_type, items, kcal, protein_g, carbs_g, fat_g, confidence_note, source, verified')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59.999`)
      .order('logged_at', { ascending: false });
    setRows((data ?? []) as FoodLogRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading || rows.length === 0) return null;

  const pending = rows.filter(r => r.source === 'auto' && !r.verified);
  const logged = rows.filter(r => !(r.source === 'auto' && !r.verified));

  const groups = MEAL_ORDER
    .map(mealType => ({ mealType, rows: logged.filter(r => (r.meal_type ?? 'meal') === mealType) }))
    .filter(g => g.rows.length > 0);
  const other = logged.filter(r => !MEAL_ORDER.includes(r.meal_type ?? 'meal'));
  if (other.length > 0) groups.push({ mealType: 'meal', rows: other });

  return (
    <>
      {pending.map(row => (
        <button
          key={row.id}
          onClick={() => setReviewRow(row)}
          className="w-full text-left bg-[#CAFF40]/[0.06] border border-[#CAFF40]/20 rounded-2xl p-4 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-[#FFFFFF]">
            Logged your usual <span className="capitalize">{row.meal_type ?? 'meal'}</span> — tap to review.
          </p>
          <ChevronRight className="w-4 h-4 text-[#CAFF40] shrink-0" />
        </button>
      ))}

      {groups.length > 0 && (
        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-3">Today's Log</p>
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.mealType}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C] mb-1.5 capitalize">{group.mealType}</p>
                <div className="space-y-2">
                  {group.rows.map(row => (
                    <div key={row.id} className="flex items-center justify-between">
                      <p className="text-xs text-[#A0A0A0]">
                        {Math.round(row.kcal)} kcal · {Math.round(row.protein_g)}p / {Math.round(row.carbs_g)}c / {Math.round(row.fat_g)}f
                      </p>
                      <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewRow && (
        <LogMealSheet
          onClose={() => setReviewRow(null)}
          onLogged={() => { setReviewRow(null); load(); }}
          reviewEntry={{
            logId: reviewRow.id,
            mealType: reviewRow.meal_type ?? 'meal',
            estimate: {
              items: reviewRow.items ?? [],
              totals: { kcal: reviewRow.kcal, protein_g: reviewRow.protein_g, carbs_g: reviewRow.carbs_g, fat_g: reviewRow.fat_g },
              confidence_note: reviewRow.confidence_note ?? '',
            },
          }}
        />
      )}
    </>
  );
}
