import React, { useState } from 'react';
import { ChevronRight, Dumbbell, Target, Calendar, Home, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingScreenProps {
  onComplete: () => void;
}

function Option({
  label, selected, onClick, sub
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
        selected
          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C] font-semibold'
          : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB] hover:border-[#C9A84C]/30'
      }`}
    >
      <span className="font-medium text-[#F0F4FF]">{label}</span>
      {sub && <span className="block text-xs text-[#445577] mt-0.5">{sub}</span>}
    </button>
  );
}

function Toggle({
  label, selected, onClick
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
        selected
          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C]'
          : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB] hover:border-[#C9A84C]/30'
      }`}
    >
      {label}
    </button>
  );
}

function Section({
  title, icon: Icon, children
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#C9A84C]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(0);
  const [equipment, setEquipment] = useState('');

  const [injuries, setInjuries] = useState<string[]>([]);
  const [protocol, setProtocol] = useState('');

  const toggleInjury = (injury: string) => {
    setInjuries(prev =>
      prev.includes(injury) ? prev.filter(i => i !== injury) : [...prev, injury]
    );
  };

  const isComplete = () =>
    age && gender && weight && height && goal &&
    experience && daysPerWeek > 0 && equipment && protocol;

  const handleSave = async () => {
    if (!user || !isComplete()) return;
    setSaving(true);
    setError('');

    try {
      const weight_kg = unit === 'lbs'
        ? parseFloat(weight) * 0.453592
        : parseFloat(weight);

      const { error: err } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          age: parseInt(age),
          gender,
          weight_kg: Math.round(weight_kg * 10) / 10,
          height_cm: parseFloat(height),
          goal,
          experience,
          days_per_week: daysPerWeek,
          equipment,
          injuries,
          protocol,
          allergies: [],
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (err) throw err;
      onComplete();
    } catch (err: unknown) {
      setError('Could not save. Please try again.');
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] pb-32">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-2">
          Physical Profile
        </p>
        <h1 className="text-3xl font-black text-[#F0F4FF] mb-1">
          Build Your Plan
        </h1>
        <p className="text-sm text-[#8899BB]">
          Takes 2 minutes. Everything gets customized to your answers.
        </p>
      </div>

      <div className="px-5">

        <Section title="Your Body" icon={Zap}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-[#445577] mb-1 block">Age</label>
              <input
                type="number"
                placeholder="32"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-xl px-3 py-2.5 text-sm text-[#F0F4FF] placeholder:text-[#445577] focus:border-[#C9A84C]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#445577] mb-1 block">Height (cm)</label>
              <input
                type="number"
                placeholder="178"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-xl px-3 py-2.5 text-sm text-[#F0F4FF] placeholder:text-[#445577] focus:border-[#C9A84C]/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#445577]">Weight</label>
              <div className="flex gap-1">
                {(['kg', 'lbs'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      unit === u
                        ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                        : 'text-[#445577]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              placeholder={unit === 'kg' ? '80' : '176'}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-xl px-3 py-2.5 text-sm text-[#F0F4FF] placeholder:text-[#445577] focus:border-[#C9A84C]/50 focus:outline-none"
            />
          </div>

          <div className="pt-1">
            <label className="text-xs text-[#445577] mb-2 block">Gender</label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ].map(g => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    gender === g.value
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C]'
                      : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Your Goal" icon={Target}>
          {[
            { value: 'fat_loss', label: 'Fat Loss', sub: 'Lose body fat, preserve muscle' },
            { value: 'muscle_gain', label: 'Muscle Gain', sub: 'Build size and strength' },
            { value: 'recomp', label: 'Body Recomposition', sub: 'Lose fat and gain muscle simultaneously' },
            { value: 'maintenance', label: 'Maintenance', sub: 'Stay strong and healthy' },
          ].map(g => (
            <Option
              key={g.value}
              label={g.label}
              sub={g.sub}
              selected={goal === g.value}
              onClick={() => setGoal(g.value)}
            />
          ))}
        </Section>

        <Section title="Training Experience" icon={Dumbbell}>
          {[
            { value: 'beginner', label: 'Beginner', sub: 'Less than 1 year of consistent training' },
            { value: 'intermediate', label: 'Intermediate', sub: '1-3 years, know the main lifts' },
            { value: 'advanced', label: 'Advanced', sub: '3+ years, trained with periodization' },
          ].map(e => (
            <Option
              key={e.value}
              label={e.label}
              sub={e.sub}
              selected={experience === e.value}
              onClick={() => setExperience(e.value)}
            />
          ))}
        </Section>

        <Section title="Days Per Week" icon={Calendar}>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                onClick={() => setDaysPerWeek(d)}
                className={`aspect-square rounded-xl border text-sm font-bold transition-all ${
                  daysPerWeek === d
                    ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C]'
                    : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {daysPerWeek > 0 && (
            <p className="text-xs text-[#C9A84C] mt-2 text-center">
              {daysPerWeek <= 2 ? 'Full body sessions' :
               daysPerWeek === 3 ? 'Full body or Push/Pull/Legs' :
               daysPerWeek === 4 ? 'Upper/Lower split' :
               'Push/Pull/Legs split'}
            </p>
          )}
        </Section>

        <Section title="Equipment Access" icon={Home}>
          {[
            { value: 'gym', label: 'Gym', sub: 'Full equipment — barbells, cables, machines' },
            { value: 'home', label: 'Home', sub: 'Bodyweight and basic equipment' },
            { value: 'both', label: 'Both', sub: 'Mix of gym and home training' },
          ].map(e => (
            <Option
              key={e.value}
              label={e.label}
              sub={e.sub}
              selected={equipment === e.value}
              onClick={() => setEquipment(e.value)}
            />
          ))}
        </Section>

        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-[#C9A84C]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Injuries / Limitations
            </p>
          </div>
          <p className="text-xs text-[#445577] mb-3">
            Select any that apply. Exercises will be substituted automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Knee', 'Lower Back', 'Shoulder', 'Hip',
              'Elbow', 'Wrist', 'Ankle', 'Neck', 'None'
            ].map(injury => (
              <Toggle
                key={injury}
                label={injury}
                selected={
                  injury === 'None'
                    ? injuries.length === 0
                    : injuries.includes(injury.toLowerCase())
                }
                onClick={() => {
                  if (injury === 'None') {
                    setInjuries([]);
                  } else {
                    toggleInjury(injury.toLowerCase());
                  }
                }}
              />
            ))}
          </div>
        </div>

        <Section title="Nutrition Approach" icon={Target}>
          {[
            { value: 'standard', label: 'Balanced', sub: 'Protein + carbs + fats — flexible and sustainable' },
            { value: 'high_protein', label: 'High Protein', sub: 'Prioritize protein, moderate carbs and fats' },
            { value: 'carnivore', label: 'Carnivore / Animal-Based', sub: 'Meat, organs, eggs — zero plant carbs' },
            { value: 'glp1', label: 'GLP-1 Protocol', sub: 'On Ozempic / Wegovy — muscle preservation focus' },
          ].map(p => (
            <Option
              key={p.value}
              label={p.label}
              sub={p.sub}
              selected={protocol === p.value}
              onClick={() => setProtocol(p.value)}
            />
          ))}
        </Section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#070B14]/95 backdrop-blur border-t border-[#1E2D40] px-5 py-4 z-50">
        {!isComplete() && (
          <p className="text-xs text-[#445577] text-center mb-2">
            Complete all sections to continue
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={!isComplete() || saving}
          className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] disabled:opacity-40 text-black font-black py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2"
        >
          {saving ? 'Building your plan...' : (
            <><span>Generate My Personalized Plan</span><ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}
