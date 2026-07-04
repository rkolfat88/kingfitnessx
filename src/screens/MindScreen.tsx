import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MindGym from '../components/mind/MindGym';
import OnboardingChain from '../components/onboarding/OnboardingChain';
import { generatePlans } from '../lib/plan-generator';

interface MindScreenProps {
  onNavigateToCheckin?: () => void;
}

export default function MindScreen({ onNavigateToCheckin }: MindScreenProps) {
  const { user } = useAuth();
  const [mindProfile, setMindProfile] = useState<any>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadMindProfile();
  }, [user]);

  const loadMindProfile = async () => {
    const { data } = await supabase
      .from('mind_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    let profile = data;
    if (!data) {
      const { data: newProfile } = await supabase
        .from('mind_profiles')
        .upsert({ user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      profile = newProfile;
    }
    setMindProfile(profile);

    const { data: onboardingData } = await supabase
      .from('onboarding_data')
      .select('onboarding_completed')
      .eq('user_id', user!.id)
      .maybeSingle();

    // If onboarding is complete but no training plan exists, regenerate the plan
    if (onboardingData?.onboarding_completed) {
      const { data: existingPlan } = await supabase
        .from('training_plans')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!existingPlan) {
        console.log('No plan found - regenerating...');
        await generatePlans(user!.id);
      }
    }

    setOnboardingComplete(onboardingData?.onboarding_completed ?? false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-10 h-10 text-[#CAFF40] animate-pulse" />
          <p className="text-[#A0A0A0] text-sm">Loading your mind profile...</p>
        </div>
      </div>
    );
  }

  const bothComplete =
    mindProfile?.phase_zero_completed === true &&
    onboardingComplete === true;

  if (!bothComplete) {
    return (
      <OnboardingChain
        onComplete={loadMindProfile}
      />
    );
  }

  return <MindGym mindProfile={mindProfile} onRefresh={loadMindProfile} onNavigateToCheckin={onNavigateToCheckin} />;
}
