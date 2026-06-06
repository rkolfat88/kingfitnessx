import React, { useState } from 'react';
import { Award, Zap, Dumbbell, Calendar, Heart, ArrowRight, Loader2, Play } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('hypertrophy');
  const [experience, setExperience] = useState('intermediate');
  const [equipment, setEquipment] = useState('full-gym');
  const [days, setDays] = useState(4);
  const [injury, setInjury] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Begin compilation animation
      setIsGenerating(true);
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p > 100) {
          clearInterval(interval);
          onComplete({ goal, experience, equipment, days, injury });
        } else {
          setProgress(p);
        }
      }, 100);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-[500px] text-center bg-[#080808] text-white">
        <div className="relative w-24 h-24 mb-6">
          {/* Circular neon gold glow spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-gold-base border-r-gold-base animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-gold-base font-black text-xs font-mono">
            {progress}%
          </div>
        </div>
        
        <h3 className="text-xl font-extrabold tracking-tight font-display text-white">
          BUILDING ATHLETIC ARCHITECTURE
        </h3>
        <p className="text-xs text-[#909090] max-w-[280px] leading-relaxed mt-2 font-mono">
          Correlating heart rate variability, joint torque variables, and Coach King's hypertrophy vectors...
        </p>

        {/* Loading elements list simulated feedback */}
        <div className="mt-8 space-y-2 w-full max-w-[240px]">
          <div className="flex justify-between text-[9px] font-mono text-gold-base font-bold">
            <span>● Syncing WHOOP Baseline</span>
            <span>OK</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#909090] font-bold">
            <span className={progress >= 40 ? 'text-gold-base' : ''}>● Joint Kinematic Range Mapping</span>
            <span>{progress >= 40 ? 'OK' : 'WAIT'}</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#909090] font-bold">
            <span className={progress >= 80 ? 'text-gold-base' : ''}>● Linear Periodization Plan</span>
            <span>{progress >= 80 ? 'OK' : 'WAIT'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in py-2">
      {/* Onboarding Header with step indicators */}
      <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl border border-gold-base/15">
        <span className="text-[10px] uppercase font-bold text-gold-base font-mono tracking-widest">
          ATHLETE SIGNUP // STEP {step} OF {totalSteps}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-1.5 rounded-full transition-all duration-200 ${
                i + 1 <= step ? 'bg-gold-base w-5' : 'bg-[#333]'
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-2xl font-black font-display text-[#F0F0F0] tracking-tight">What is your absolute primary goal?</h3>
            <p className="text-xs text-[#909090] mt-1 font-mono">Adaptive algorithms model your energy systems based on this focus.</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { id: 'hypertrophy', label: 'Athletic Hypertrophy (Muscle Gain)', desc: 'Optimized tension triggers & localized density blocks.', icon: Zap },
              { id: 'strength', label: 'Maximum Peak Strength (Powerlifting)', desc: 'Linear neurological recruitment and compound focus.', icon: Dumbbell },
              { id: 'longevity', label: 'Peak Recovery & Longevity (Whole Athlete)', desc: 'VO2 max conditioning, joint load, and lower baseline HR.', icon: Heart },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setGoal(option.id)}
                className={`w-full p-4 rounded-xl border text-left transition duration-150 ${
                  goal === option.id
                    ? 'bg-gold-base/10 border-gold-base text-white'
                    : 'bg-[#1A1A1A] border-white/5 text-[#909090] hover:border-gold-base/30'
                }`}
              >
                <div className="flex gap-3">
                  <option.icon className={`w-5 h-5 shrink-0 ${goal === option.id ? 'text-gold-base' : 'text-[#777]'}`} />
                  <div>
                    <h4 className="text-sm font-bold text-[#F0F0F0]">{option.label}</h4>
                    <p className="text-[11px] text-[#808080] mt-1 pr-2 leading-relaxed">{option.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-2xl font-black font-display text-[#F0F0F0] tracking-tight">Your lifting experience level?</h3>
            <p className="text-xs text-[#909090] mt-1 font-mono">Governs baseline biomechanical stability expectations.</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { id: 'novice', title: 'Beginner / Novice Athlete', desc: 'Focusing on strict kinetic form models, moderate weight variables, and basic compounds.' },
              { id: 'intermediate', title: 'Intermediate Athlete (1-3 yrs)', desc: 'Familiar with core bar mechanics, standard RPE scale weights, and minor adjustments.' },
              { id: 'advanced', title: 'Master Athlete / Advanced (4+ yrs)', desc: 'Skeletal density thresholds reached. Periodized block variations and micro-loads required.' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setExperience(lvl.id)}
                className={`w-full p-4 rounded-xl border text-left transition duration-150 ${
                  experience === lvl.id
                    ? 'bg-gold-base/10 border-gold-base text-white'
                    : 'bg-[#1A1A1A] border-white/5 text-[#909090] hover:border-gold-base/30'
                }`}
              >
                <h4 className="text-sm font-bold text-[#F0F0F0]">{lvl.title}</h4>
                <p className="text-[11px] text-[#808080] mt-1 leading-relaxed">{lvl.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-2xl font-black font-display text-[#F0F0F0] tracking-tight">What equipment do you have?</h3>
            <p className="text-xs text-[#909090] mt-1 font-mono">Ensures no unworkable movements enter your active dashboards.</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { id: 'full-gym', label: 'Commercial Gym Setup', desc: 'Full access to power racks, specialty barbells, smith track, cable vectors, and leg presses.' },
              { id: 'dumbbells', label: 'Basic Bench & Dumbbells', desc: 'Standard adjustable dumbbells, flat/incline bench, and pull-up accessories.' },
              { id: 'bodyweight', label: 'Calisthenics & Bodyweight Only', desc: 'Parallettes, pull-up bar, resistance bands, and travel-safe floor spaces.' },
            ].map((eq) => (
              <button
                key={eq.id}
                onClick={() => setEquipment(eq.id)}
                className={`w-full p-4 rounded-xl border text-left transition duration-150 ${
                  equipment === eq.id
                    ? 'bg-gold-base/10 border-gold-base text-white'
                    : 'bg-[#1A1A1A] border-white/5 text-[#909090] hover:border-gold-base/30'
                }`}
              >
                <h4 className="text-sm font-bold text-[#F0F0F0]">{eq.label}</h4>
                <p className="text-[11px] text-[#808080] mt-1 leading-relaxed">{eq.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-2xl font-black font-display text-[#F0F0F0] tracking-tight">Weekly commitment days?</h3>
            <p className="text-xs text-[#909090] mt-1 font-mono">We distribute volume and fatigue tracking ratios dynamically.</p>
          </div>

          <div className="space-y-3 pt-2 select-none">
            {[3, 4, 5, 6].map((dayNum) => (
              <button
                key={dayNum}
                onClick={() => setDays(dayNum)}
                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition duration-150 ${
                  days === dayNum
                    ? 'bg-gold-base/10 border-gold-base text-white'
                    : 'bg-[#1A1A1A] border-white/5 text-[#909090] hover:border-gold-base/30'
                }`}
              >
                <div>
                  <h4 className="text-sm font-bold text-[#F0F0F0]">{dayNum} Days Per Week</h4>
                  <p className="text-[11px] text-[#808080] mt-1 font-mono">
                    {dayNum === 3 && 'Full Body Split (Recovery Dominant)'}
                    {dayNum === 4 && 'Upper/Lower Split (Optimal Balance)'}
                    {dayNum === 5 && 'Hypertrophy-focused Rotation Split'}
                    {dayNum === 6 && 'Push/Pull/Legs Elite Frequency Rotation'}
                  </p>
                </div>
                <Calendar className={`w-5 h-5 ${days === dayNum ? 'text-gold-base' : 'text-[#505050]'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-2xl font-black font-display text-[#F0F0F0] tracking-tight">Any joint/musculoskeletal injuries?</h3>
            <p className="text-xs text-[#909090] mt-1 font-mono">AI Coach customizes structural angles and cautions.</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { id: 'none', label: 'Pure Health (No current issues)', desc: 'Symmetry is normal. Load factors follow linear thresholds.' },
              { id: 'joints', label: 'Knee / Hip Joint Caution', desc: 'Coach restricts deep flexion on heavy compounds; locks in horizontal vectors.' },
              { id: 'spinal', label: 'Lumbar / Back Caution', desc: 'Restricts axial spine compression; swaps heavy squats with chest-supported variables.' },
            ].map((inj) => (
              <button
                key={inj.id}
                onClick={() => setInjury(inj.id)}
                className={`w-full p-4 rounded-xl border text-left transition duration-150 ${
                  injury === inj.id
                    ? 'bg-gold-base/10 border-gold-base text-white'
                    : 'bg-[#1A1A1A] border-white/5 text-[#909090] hover:border-gold-base/30'
                }`}
              >
                <h4 className="text-sm font-bold text-[#F0F0F0]">{inj.label}</h4>
                <p className="text-[11px] text-[#808080] mt-1 leading-relaxed">{inj.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Button controls row */}
      <div className="flex gap-4 pt-4">
        {step > 1 && (
          <button
            onClick={() => setStep(prev => prev - 1)}
            className="flex-1 py-3 bg-transparent border border-white/10 text-white font-extrabold uppercase text-xs rounded-full transition duration-150 hover:bg-[#111]"
          >
            Back
          </button>
        )}
        
        <button
          onClick={handleNext}
          className="flex-2 py-3 bg-gold-base hover:bg-gold-light text-black font-extrabold uppercase tracking-widest text-xs rounded-full transition-all duration-150 flex items-center justify-center gap-2"
        >
          <span>{step === totalSteps ? 'GENERATE ARCHITECTURE' : 'CONTINUE'}</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
