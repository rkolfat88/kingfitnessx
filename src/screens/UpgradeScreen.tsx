import React, { useEffect, useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { HeaderBar } from '../components/HeaderBar';

interface UpgradeScreenProps {
  onBack?: () => void;
}

interface MetabolicPersonalization {
  estimated_tdee: number;
  data_days: number;
  trend_weight_kg: number | null;
}

export default function UpgradeScreen({ onBack }: UpgradeScreenProps) {
  const { trialDaysLeft, accessState } = useAuth();
  const [metabolic, setMetabolic] = useState<MetabolicPersonalization | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      try {
        const res = await fetch('/api/agents/metabolic', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const body = await res.json();
          setMetabolic(body.state);
        }
      } catch {
        // Personalization is a nice-to-have — silently degrade to generic copy.
      }
    })();
  }, []);

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    setError('');
    setLoadingPlan(plan);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError('Not authenticated');
      setLoadingPlan(null);
      return;
    }
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? 'Could not start checkout');
        setLoadingPlan(null);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError('Network error — try again');
      setLoadingPlan(null);
    }
  };

  const personalizedLine = metabolic && metabolic.data_days >= 7
    ? `KFX has learned your real expenditure: ~${metabolic.estimated_tdee} kcal/day from ${metabolic.data_days} days of your own data${metabolic.trend_weight_kg ? `, trend weight ${metabolic.trend_weight_kg.toFixed(1)}kg` : ''}. That's the engine you'd be walking away from.`
    : null;

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <HeaderBar onBack={onBack} title="Upgrade" />

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <div className="flex flex-col items-center text-center mb-8 mt-2">
          <div className="w-16 h-16 rounded-2xl bg-[#CAFF40]/10 border border-[#CAFF40]/25 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-[#CAFF40]" />
          </div>
          <h1 className="text-3xl font-black text-[#FFFFFF] mb-2">
            {accessState === 'expired' ? 'Your trial has ended' : 'Keep your progress going'}
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            {accessState === 'trialing' && trialDaysLeft != null
              ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your trial.`
              : 'Upgrade to keep logging, chatting with Coach, and generating plans.'}
          </p>
        </div>

        {personalizedLine && (
          <div className="bg-[#CAFF40]/[0.06] border border-[#CAFF40]/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-[#FFFFFF]">{personalizedLine}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleCheckout('monthly')}
            disabled={loadingPlan !== null}
            className="w-full bg-[#CAFF40] text-[#000000] font-black rounded-2xl p-5 flex items-center justify-between disabled:opacity-60"
          >
            <div className="text-left">
              <p className="text-lg font-black">$49/month</p>
              <p className="text-xs font-semibold opacity-70">Cancel anytime</p>
            </div>
            {loadingPlan === 'monthly' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleCheckout('annual')}
            disabled={loadingPlan !== null}
            className="w-full bg-[#0D0D0D] border border-[#CAFF40]/30 text-[#FFFFFF] font-black rounded-2xl p-5 flex items-center justify-between disabled:opacity-60"
          >
            <div className="text-left">
              <p className="text-lg font-black">$399/year</p>
              <p className="text-xs font-semibold text-[#CAFF40]">Save ~32% vs monthly</p>
            </div>
            {loadingPlan === 'annual' ? <Loader2 className="w-5 h-5 animate-spin text-[#CAFF40]" /> : <Check className="w-5 h-5 text-[#CAFF40]" />}
          </button>
        </div>

        {error && <p className="text-xs text-[#EF4444] text-center mb-4">{error}</p>}

        <p className="text-xs text-[#5C5C5C] text-center">
          Secure checkout via Stripe. Your data and history carry over — nothing is lost.
        </p>
      </div>
    </div>
  );
}
