import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PhaseZero from '../components/mind/PhaseZero';
import MindGym from '../components/mind/MindGym';

export default function MindScreen() {
  const { user } = useAuth();
  const [mindProfile, setMindProfile] = useState<any>(null);
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

    if (!data) {
      // Create new mind profile
      const { data: newProfile } = await supabase
        .from('mind_profiles')
        .upsert({ user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      setMindProfile(newProfile);
    } else {
      setMindProfile(data);
    }
    setLoading(false);
  };

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
      />
    );
  }

  return <MindGym mindProfile={mindProfile} onRefresh={loadMindProfile} />;
}
