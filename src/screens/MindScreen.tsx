import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PhaseZero from '../components/mind/PhaseZero';
import MindGym from '../components/mind/MindGym';
import OnboardingScreen from './OnboardingScreen';
import { generatePlans } from '../lib/plan-generator';

export default function MindScreen() {
  const { user } = useAuth();
  const [mindProfile, setMindProfile] = useState<any>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

    setOnboardingComplete(onboardingData?.onboarding_completed ?? false);
    setLoading(false);
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-5 text-center">
        <div className="text-5xl mb-6 animate-pulse">⚙️</div>
        <h2 className="text-2xl font-black text-[#F0F4FF] mb-3">
          Building Your Plan
        </h2>
        <p className="text-sm text-[#8899BB] max-w-xs leading-relaxed">
          The engine is calculating your personalized training,
          nutrition, and performance system.
        </p>
        <div className="mt-8 flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-10 h-10 text-[#C9A84C] animate-pulse" />
          <p className="text-[#8899BB] text-sm">Loading your mind profile...</p>
        </div>
      </div>
    );
  }

  if (!mindProfile?.phase_zero_completed) {
    return (
      <PhaseZero
        mindProfile={mindProfile}
        onComplete={loadMindProfile}
        onSectionComplete={loadMindProfile}
      />
    );
  }

  if (!onboardingComplete) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          setGenerating(true);
          if (user) await generatePlans(user.id);
          setOnboardingComplete(true);
          setGenerating(false);
        }}
      />
    );
  }

  return <MindGym mindProfile={mindProfile} onRefresh={loadMindProfile} />;
}
