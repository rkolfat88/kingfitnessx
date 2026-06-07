import React, { useEffect, useState } from 'react';
import { Apple, BarChart3, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export default function FuelScreen() {
  const { user } = useAuth();
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [protocol, setProtocol] = useState('');
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMath, setShowMath] = useState(false);

  useEffect(() => {
    if (user) loadPlan();
  }, [user]);

  const loadPlan = async () => {
    const { data } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setMacros({
        calories: data.daily_calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
      });
      setProtocol(data.protocol || '');
      setReasoning(data.reasoning || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Apple className="w-8 h-8 text-[#C9A84C] animate-pulse" />
      </div>
    );
  }

  if (!macros) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-5 text-center">
        <Apple className="w-10 h-10 text-[#445577] mb-4" />
        <h2 className="text-xl font-black text-[#F0F4FF] mb-2">No Plan Yet</h2>
        <p className="text-sm text-[#8899BB]">Complete onboarding to generate your nutrition plan.</p>
      </div>
    );
  }

  const protocolLabels: Record<string, string> = {
    standard: 'Balanced Protocol',
    high_protein: 'High Protein Protocol',
    carnivore: 'Carnivore Protocol',
    glp1: 'GLP-1 Muscle Preservation Protocol',
  };

  const proteinCals = macros.protein_g * 4;
  const carbsCals = macros.carbs_g * 4;
  const fatCals = macros.fat_g * 9;
  const macroPercent = (cals: number) => Math.round((cals / macros.calories) * 100);

  return (
    <div className="min-h-screen bg-[#070B14] pb-24">
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-1">
          Your Nutrition
        </p>
        <h1 className="text-3xl font-black text-[#F0F4FF] mb-1">
          Fuel System
        </h1>
        <p className="text-sm text-[#C9A84C] font-semibold">
          {protocolLabels[protocol] || 'Custom Protocol'}
        </p>
      </div>

      <div className="px-5 space-y-4">

        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-4">
            Daily Targets
          </p>

          <div className="text-center mb-6">
            <p className="text-5xl font-black text-[#F0F4FF]">{macros.calories}</p>
            <p className="text-sm text-[#8899BB] mt-1">calories / day</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Protein', grams: macros.protein_g, cals: proteinCals, color: '#C9A84C', note: 'LOCKED — muscle preservation' },
              { label: 'Carbs', grams: macros.carbs_g, cals: carbsCals, color: '#3B82F6', note: protocol === 'carnivore' ? 'Zero — carnivore protocol' : '' },
              { label: 'Fat', grams: macros.fat_g, cals: fatCals, color: '#F97316', note: '' },
            ].map(macro => (
              <div key={macro.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-semibold text-[#F0F4FF]">{macro.label}</span>
                    {macro.note && (
                      <span className="text-xs text-[#445577] ml-2">{macro.note}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black" style={{ color: macro.color }}>
                      {macro.grams}g
                    </span>
                    <span className="text-xs text-[#445577] ml-1">
                      {macroPercent(macro.cals)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[#1A2236] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${macroPercent(macro.cals)}%`,
                      backgroundColor: macro.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowMath(!showMath)}
          className="w-full bg-[#111827] border border-[#1E2D40] hover:border-[#C9A84C]/30 rounded-2xl p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-sm font-semibold text-[#F0F4FF]">How were these calculated?</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#445577] transition-transform ${showMath ? 'rotate-180' : ''}`} />
        </button>

        {showMath && (
          <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-4 space-y-2">
            {reasoning.map((r, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#C9A84C] text-xs mt-0.5">→</span>
                <p className="text-xs text-[#8899BB] leading-relaxed font-mono">{r}</p>
              </div>
            ))}
          </div>
        )}

        {protocol === 'carnivore' && (
          <div className="bg-[#F97316]/5 border border-[#F97316]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-1">
              Carnivore Protocol
            </p>
            <p className="text-sm text-[#8899BB] leading-relaxed">
              Zero carbs. Fat is your primary fuel source.
              Protein is locked to preserve muscle mass.
              Focus on meat, organs, eggs, and animal fats.
            </p>
          </div>
        )}

        {protocol === 'glp1' && (
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#22C55E] uppercase tracking-widest mb-1">
              GLP-1 Muscle Preservation
            </p>
            <p className="text-sm text-[#8899BB] leading-relaxed">
              Protein raised to 2.4g/kg lean mass to counter
              muscle loss during rapid weight reduction.
              Resistance training is critical — use your training plan.
            </p>
          </div>
        )}

        <div className="bg-[#111827] border border-[#1E2D40] rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB] mb-3">
            Meal Timing
          </p>
          <div className="space-y-2">
            {[
              { time: 'Pre-workout', note: 'Light meal 60-90 min before. Protein + carbs (if not carnivore).' },
              { time: 'Post-workout', note: 'Largest protein serving within 2h of training.' },
              { time: 'Before bed', note: 'Casein-rich protein (cottage cheese, Greek yogurt) if goal is muscle gain.' },
            ].map(item => (
              <div key={item.time} className="flex gap-3">
                <span className="text-xs font-bold text-[#C9A84C] w-24 flex-shrink-0 mt-0.5">{item.time}</span>
                <p className="text-xs text-[#8899BB] leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
