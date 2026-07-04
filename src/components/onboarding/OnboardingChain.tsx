import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { OnboardingRecord } from '../../contexts/AuthContext';
import { generatePlans } from '../../lib/plan-generator';
import { PlanReadyScreen } from '../../screens/PlanReadyScreen';
import type { GeneratedPlanData } from '../../lib/plan-generator';

interface OnboardingChainProps {
  onComplete: () => void;
  savedData?: OnboardingRecord | null;
}

// ─── Types ────────────────────────────────────────────────────
interface ChainData {
  // Page 1 — Mindset Foundation
  name: string;
  honest_start: string;        // how many times started/quit
  current_feeling: string;     // how they feel about fitness now
  real_reason: string;         // why they actually want to change
  identity_word: string;       // one word for who they're becoming
  fear: string;                // biggest fear about this

  // Page 2 — Training Relationship (adapts to page 1)
  experience_level: string;    // beginner/intermediate/advanced
  past_program: string;        // what they did before
  quit_reason: string;         // why they stopped (adapts to honest_start)
  best_moment: string;         // best training moment they remember
  days_available: number;      // real days, not aspirational
  energy_window: string;       // when they actually have energy
  obstacle: string;            // biggest obstacle right now

  // Page 3 — Physical Details
  age: string;
  gender: string;
  weight: string;
  weight_unit: 'kg' | 'lbs';
  height: string;
  goal: string;
  equipment: string;
  injuries: string[];
  protocol: string;
}

// ─── Option Button ─────────────────────────────────────────────
function Opt({
  label, sub, selected, onClick
}: {
  key?: React.Key;
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
        selected
          ? 'bg-[#CAFF40]/10 border-[#CAFF40]/50'
          : 'bg-[#0D0D0D] border-[#262626] hover:border-[#CAFF40]/30'
      }`}
    >
      <span className={`text-sm font-semibold ${selected ? 'text-[#CAFF40]' : 'text-[#FFFFFF]'}`}>
        {label}
      </span>
      {sub && <span className="block text-xs text-[#5C5C5C] mt-0.5">{sub}</span>}
    </button>
  );
}

// ─── Text Input ────────────────────────────────────────────────
function TextIn({
  placeholder, value, onChange, rows = 2
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-[#0D0D0D] border border-[#262626] rounded-xl px-4 py-3 text-sm text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:border-[#CAFF40]/50 focus:outline-none resize-none transition-all"
    />
  );
}

// ─── Number Input ──────────────────────────────────────────────
function NumIn({
  placeholder, value, onChange
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0D0D0D] border border-[#262626] rounded-xl px-4 py-3 text-sm text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:border-[#CAFF40]/50 focus:outline-none transition-all"
    />
  );
}

// ─── Section label ─────────────────────────────────────────────
function Q({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-[#FFFFFF] mb-2 leading-relaxed">
      {children}
    </p>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-4 space-y-2">
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — WHO ARE YOU (Mindset Foundation)
// ═══════════════════════════════════════════════════════════════
function Page1({
  data, update, onNext
}: {
  data: ChainData;
  update: (k: keyof ChainData, v: any) => void;
  onNext: () => void;
}) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const isComplete = disclaimerAccepted &&
    data.name.trim().length > 1 &&
    data.honest_start &&
    data.current_feeling &&
    data.real_reason.trim().length > 5 &&
    data.identity_word.trim().length > 1 &&
    data.fear;

  return (
    <div className="min-h-screen bg-[#000000] pb-32">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#CAFF40] mb-2">
          Step 1 of 3
        </p>
        <h1 className="text-3xl font-black text-[#FFFFFF] mb-1">
          Who Are You?
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          No filters. No performance. Just truth.
        </p>
      </div>

      <div className="px-5 space-y-4">

        {/* DISCLAIMER — must accept before proceeding */}
        <div className="bg-[#0D0D0D] border border-[#F97316]/30 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#FFFFFF] mb-2">
                Before we begin
              </p>
              <p className="text-xs text-[#A0A0A0] leading-relaxed mb-2">
                KFX — King Fitness Experience provides personalized fitness and nutrition
                guidance based on your answers. This is not medical advice.
                The plans, recommendations, and coaching generated by this
                system are for educational and motivational purposes only.
              </p>
              <p className="text-xs text-[#A0A0A0] leading-relaxed mb-2">
                Do not use this app as a substitute for professional medical
                advice, diagnosis, or treatment. If you have any medical
                condition, injury, or health concern — including but not
                limited to heart disease, diabetes, pregnancy, or orthopedic
                injuries — consult a qualified healthcare professional before
                starting any exercise or nutrition program.
              </p>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                By continuing, you confirm that you are 18 years or older
                and accept full responsibility for your participation in
                any program generated by this system.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
            className={`w-full py-3 rounded-xl border text-sm font-bold transition-all ${
              disclaimerAccepted
                ? 'bg-[#22C55E]/10 border-[#22C55E]/50 text-[#22C55E]'
                : 'bg-[#0D0D0D] border-[#F97316]/30 text-[#F97316]'
            }`}
          >
            {disclaimerAccepted ? '✓ I understand and accept' : 'I have read and understand this'}
          </button>
        </div>

        {/* Name */}
        <Block>
          <Q>What do you want us to call you?</Q>
          <TextIn
            placeholder="Your name or nickname"
            value={data.name}
            onChange={v => update('name', v)}
            rows={1}
          />
        </Block>

        {/* Honest start */}
        <Block>
          <Q>Be honest — how many times have you started a fitness program and stopped?</Q>
          {[
            { v: 'first_time', l: 'This is my first time', s: "Fresh start — no baggage" },
            { v: 'once_twice', l: '1 or 2 times', s: "You know what starting feels like" },
            { v: 'several', l: '3 to 5 times', s: "The cycle is familiar" },
            { v: 'many', l: 'More times than I want to admit', s: "You're not alone in this" },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.honest_start === o.v}
              onClick={() => update('honest_start', o.v)} />
          ))}
        </Block>

        {/* Current feeling */}
        <Block>
          <Q>Right now, when you think about getting in shape, you feel:</Q>
          {[
            { v: 'ready', l: 'Ready — I want this', s: "The motivation is there" },
            { v: 'scared', l: 'Scared I will fail again', s: "Fear of the same old pattern" },
            { v: 'tired', l: 'Tired of starting over', s: "Exhausted by the cycle" },
            { v: 'numb', l: "I do not feel much — just trying", s: "Neutral and just showing up" },
            { v: 'ashamed', l: 'Ashamed of where I ended up', s: "Honest is where we start" },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.current_feeling === o.v}
              onClick={() => update('current_feeling', o.v)} />
          ))}
        </Block>

        {/* Real reason — adapts label based on current_feeling */}
        <Block>
          <Q>
            {data.current_feeling === 'ashamed'
              ? "What is the moment you decided enough is enough?"
              : data.current_feeling === 'scared'
              ? "What would it mean to you if this time actually worked?"
              : data.current_feeling === 'tired'
              ? "What is different about this time — if anything?"
              : "Why do you actually want to change? Not the surface reason — the real one."}
          </Q>
          <TextIn
            placeholder="Write honestly. Nobody else reads this."
            value={data.real_reason}
            onChange={v => update('real_reason', v)}
            rows={3}
          />
        </Block>

        {/* Identity word */}
        <Block>
          <Q>
            In 6 months, the version of you that shows up every day would describe themselves as:
          </Q>
          <TextIn
            placeholder='e.g. "Disciplined" or "Someone who does not quit" or "Strong"'
            value={data.identity_word}
            onChange={v => update('identity_word', v)}
            rows={1}
          />
        </Block>

        {/* Fear */}
        <Block>
          <Q>Your biggest fear about starting this program is:</Q>
          {[
            { v: 'fail_again', l: 'Failing again and proving I cannot do this' },
            { v: 'judgment', l: 'People judging my body or progress' },
            { v: 'injury', l: 'Getting injured like before' },
            { v: 'no_results', l: 'Putting in effort and seeing no results' },
            { v: 'not_enough', l: 'Not being consistent enough' },
            { v: 'nothing', l: 'Nothing — I am not afraid' },
          ].map(o => (
            <Opt key={o.v} label={o.l}
              selected={data.fear === o.v}
              onClick={() => update('fear', o.v)} />
          ))}
        </Block>

      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur border-t border-[#262626] px-5 py-4">
        <button
          onClick={onNext}
          disabled={!isComplete}
          className="w-full bg-[#CAFF40] hover:bg-[#A8D930] disabled:opacity-30 text-black font-black py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ChevronRight className="w-5 h-5" />
        </button>
        {!disclaimerAccepted && (
          <p className="text-xs text-[#5C5C5C] text-center mt-2">
            Accept the disclaimer to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — YOUR TRAINING RELATIONSHIP (Adaptive)
// ═══════════════════════════════════════════════════════════════
function Page2({
  data, update, onNext, onPrev
}: {
  data: ChainData;
  update: (k: keyof ChainData, v: any) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  // Adapt quit_reason options based on honest_start
  const getQuitReasonOptions = () => {
    if (data.honest_start === 'first_time') return null; // skip this question
    return [
      { v: 'motivation', l: 'Lost motivation after a few weeks' },
      { v: 'life', l: 'Life got in the way — work, family, stress' },
      { v: 'no_results', l: 'Did not see results fast enough' },
      { v: 'injury', l: 'Got injured or in pain' },
      { v: 'boring', l: 'Got bored or the program felt wrong' },
      { v: 'shame', l: 'Felt embarrassed or like I did not belong' },
    ];
  };

  // Adapt best_moment question based on experience
  const getBestMomentQ = () => {
    if (data.experience_level === 'beginner' || data.honest_start === 'first_time') {
      return "What is one physical thing you have done in your life that you were proud of? (Sport, activity, anything)";
    }
    return "What is the best training moment you remember? When did your body surprise you?";
  };

  // Adapt days question label based on current_feeling
  const getDaysLabel = () => {
    if (data.current_feeling === 'tired' || data.current_feeling === 'numb') {
      return "Be realistic — not aspirational. How many days per week can you actually commit to? Even 2 is fine.";
    }
    return "How many days per week will you train? Choose what fits your real life, not your best-case scenario.";
  };

  const quitOptions = getQuitReasonOptions();

  const isComplete =
    data.experience_level &&
    (data.honest_start === 'first_time' || data.quit_reason) &&
    data.best_moment.trim().length > 3 &&
    data.days_available > 0 &&
    data.energy_window &&
    data.obstacle;

  return (
    <div className="min-h-screen bg-[#000000] pb-32">
      <div className="px-5 pt-12 pb-6">
        <button
          onClick={onPrev}
          className="w-10 h-10 -ml-2 mb-2 flex items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#A0A0A0] hover:text-[#FFFFFF] hover:border-[#3A3A3A] transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-[#CAFF40] mb-2">
          Step 2 of 3
        </p>
        <h1 className="text-3xl font-black text-[#FFFFFF] mb-1">
          Your Training Self
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          {data.name ? `${data.name}, this shapes your entire program.` : 'This shapes your entire program.'}
        </p>
      </div>

      <div className="px-5 space-y-4">

        {/* Experience */}
        <Block>
          <Q>Your training experience level:</Q>
          {[
            { v: 'beginner', l: 'Beginner', s: 'New to structured training or returning after years off' },
            { v: 'intermediate', l: 'Intermediate', s: 'Trained consistently for 1–3 years, know the main lifts' },
            { v: 'advanced', l: 'Advanced', s: '3+ years, trained with a program, understand progressive overload' },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.experience_level === o.v}
              onClick={() => update('experience_level', o.v)} />
          ))}
        </Block>

        {/* Quit reason — only if not first time */}
        {quitOptions && (
          <Block>
            <Q>
              {data.current_feeling === 'tired'
                ? "The real reason you stopped before was:"
                : "What usually kills your momentum?"}
            </Q>
            {quitOptions.map(o => (
              <Opt key={o.v} label={o.l}
                selected={data.quit_reason === o.v}
                onClick={() => update('quit_reason', o.v)} />
            ))}
          </Block>
        )}

        {/* Best moment */}
        <Block>
          <Q>{getBestMomentQ()}</Q>
          <TextIn
            placeholder="One moment. Could be years ago. Write it."
            value={data.best_moment}
            onChange={v => update('best_moment', v)}
            rows={2}
          />
        </Block>

        {/* Days available */}
        <Block>
          <Q>{getDaysLabel()}</Q>
          <div className="grid grid-cols-7 gap-1.5">
            {[1,2,3,4,5,6,7].map(d => (
              <button
                key={d}
                onClick={() => update('days_available', d)}
                className={`aspect-square rounded-xl border text-sm font-black transition-all ${
                  data.days_available === d
                    ? 'bg-[#CAFF40]/10 border-[#CAFF40]/50 text-[#CAFF40]'
                    : 'bg-[#0D0D0D] border-[#262626] text-[#A0A0A0]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {data.days_available > 0 && (
            <p className="text-xs text-[#CAFF40] mt-2">
              {data.days_available <= 2
                ? '2 days is enough to build real progress. Consistency beats frequency.'
                : data.days_available <= 4
                ? 'Solid foundation. This is where most transformations happen.'
                : 'High frequency — we will make sure recovery is built in.'}
            </p>
          )}
        </Block>

        {/* Energy window */}
        <Block>
          <Q>When do you actually have energy to train? Not when you should — when you do.</Q>
          {[
            { v: 'morning', l: 'Morning (before 10am)', s: 'Early bird — high discipline window' },
            { v: 'midday', l: 'Midday (10am–2pm)', s: 'Between work blocks' },
            { v: 'afternoon', l: 'Afternoon (2–6pm)', s: 'Post-work energy peak' },
            { v: 'evening', l: 'Evening (6–10pm)', s: 'When the day settles' },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.energy_window === o.v}
              onClick={() => update('energy_window', o.v)} />
          ))}
        </Block>

        {/* Obstacle — adapts based on quit_reason */}
        <Block>
          <Q>
            {data.quit_reason === 'motivation'
              ? "When motivation drops — and it will — what is your fallback plan?"
              : data.quit_reason === 'life'
              ? "What is the smallest version of a training session you could do on your busiest day?"
              : data.quit_reason === 'injury'
              ? "What part of your body needs the most attention or caution right now?"
              : "The single biggest obstacle standing between you and your goal right now:"}
          </Q>
          <TextIn
            placeholder="Be specific. Vague answers get vague plans."
            value={data.obstacle}
            onChange={v => update('obstacle', v)}
            rows={2}
          />
        </Block>

      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur border-t border-[#262626] px-5 py-4">
        <button
          onClick={onNext}
          disabled={!isComplete}
          className="w-full bg-[#CAFF40] hover:bg-[#A8D930] disabled:opacity-30 text-black font-black py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2"
        >
          <span>Almost there</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — YOUR BODY + DETAILS (Physical data)
// ═══════════════════════════════════════════════════════════════
function Page3({
  data, update, onSubmit, saving, onPrev
}: {
  data: ChainData;
  update: (k: keyof ChainData, v: any) => void;
  onSubmit: () => void;
  saving: boolean;
  onPrev: () => void;
}) {
  const toggleInjury = (injury: string) => {
    const current = data.injuries || [];
    if (injury === 'none') {
      update('injuries', []);
      return;
    }
    update('injuries',
      current.includes(injury)
        ? current.filter(i => i !== injury)
        : [...current.filter(i => i !== 'none'), injury]
    );
  };

  const isComplete =
    data.age && parseInt(data.age) > 0 &&
    data.gender &&
    data.weight && parseFloat(data.weight) > 0 &&
    data.height && parseFloat(data.height) > 0 &&
    data.goal &&
    data.equipment &&
    data.protocol;

  // Adapt goal question based on current_feeling
  const getGoalIntro = () => {
    if (data.current_feeling === 'ashamed') return "What change matters most to you right now?";
    if (data.current_feeling === 'ready') return "What is your primary goal?";
    return "What do you most want to change?";
  };

  return (
    <div className="min-h-screen bg-[#000000] pb-32">
      <div className="px-5 pt-12 pb-6">
        <button
          onClick={onPrev}
          className="w-10 h-10 -ml-2 mb-2 flex items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#A0A0A0] hover:text-[#FFFFFF] hover:border-[#3A3A3A] transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-[#CAFF40] mb-2">
          Step 3 of 3
        </p>
        <h1 className="text-3xl font-black text-[#FFFFFF] mb-1">
          Build Your Plan
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          Last step. The engine needs these numbers.
        </p>
      </div>

      <div className="px-5 space-y-4">

        {/* Age + Height */}
        <Block>
          <Q>Your stats</Q>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#5C5C5C] mb-1 block">Age</label>
              <NumIn placeholder="32" value={data.age} onChange={v => update('age', v)} />
            </div>
            <div>
              <label className="text-xs text-[#5C5C5C] mb-1 block">Height (cm)</label>
              <NumIn placeholder="178" value={data.height} onChange={v => update('height', v)} />
            </div>
          </div>

          {/* Weight with unit toggle */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#5C5C5C]">Weight</label>
              <div className="flex gap-1 bg-[#0D0D0D] rounded-lg p-0.5">
                {(['kg','lbs'] as const).map(u => (
                  <button key={u} onClick={() => update('weight_unit', u)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      data.weight_unit === u
                        ? 'bg-[#CAFF40]/20 text-[#CAFF40]'
                        : 'text-[#5C5C5C]'
                    }`}>{u}</button>
                ))}
              </div>
            </div>
            <NumIn
              placeholder={data.weight_unit === 'kg' ? '80' : '176'}
              value={data.weight}
              onChange={v => update('weight', v)}
            />
          </div>

          {/* Gender */}
          <div className="mt-2">
            <label className="text-xs text-[#5C5C5C] mb-1.5 block">Gender</label>
            <div className="flex gap-2">
              {['Male','Female','Other'].map(g => (
                <button key={g} onClick={() => update('gender', g.toLowerCase())}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    data.gender === g.toLowerCase()
                      ? 'bg-[#CAFF40]/10 border-[#CAFF40]/50 text-[#CAFF40]'
                      : 'bg-[#0D0D0D] border-[#262626] text-[#A0A0A0]'
                  }`}>{g}</button>
              ))}
            </div>
          </div>
        </Block>

        {/* Goal — adapts label */}
        <Block>
          <Q>{getGoalIntro()}</Q>
          {[
            { v: 'fat_loss', l: 'Lose body fat', s: 'Reduce fat, preserve or build muscle' },
            { v: 'muscle_gain', l: 'Build muscle', s: 'Add size, strength, and mass' },
            { v: 'recomp', l: 'Recomposition', s: 'Lose fat and gain muscle simultaneously' },
            { v: 'maintenance', l: 'Maintain and perform', s: 'Stay strong, feel better, sustain it' },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.goal === o.v}
              onClick={() => update('goal', o.v)} />
          ))}
        </Block>

        {/* Equipment */}
        <Block>
          <Q>What do you have access to?</Q>
          {[
            { v: 'gym', l: 'Gym', s: 'Barbells, cables, machines — full setup' },
            { v: 'home', l: 'Home setup', s: 'Bodyweight, dumbbells, resistance bands' },
            { v: 'both', l: 'Both', s: 'Mix depending on the week' },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.equipment === o.v}
              onClick={() => update('equipment', o.v)} />
          ))}
        </Block>

        {/* Injuries */}
        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-4">
          <Q>Any injuries or limitations? (exercises will be substituted automatically)</Q>
          <div className="flex flex-wrap gap-2 mt-1">
            {['Knee','Lower Back','Shoulder','Hip','Elbow','Wrist','Ankle','Neck','None'].map(i => (
              <button key={i}
                onClick={() => toggleInjury(i === 'None' ? 'none' : i.toLowerCase())}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  (i === 'None' && (!data.injuries || data.injuries.length === 0)) ||
                  (i !== 'None' && data.injuries?.includes(i.toLowerCase()))
                    ? 'bg-[#CAFF40]/10 border-[#CAFF40]/50 text-[#CAFF40]'
                    : 'bg-[#0D0D0D] border-[#262626] text-[#A0A0A0]'
                }`}
              >{i}</button>
            ))}
          </div>
        </div>

        {/* Nutrition protocol */}
        <Block>
          <Q>How do you eat?</Q>
          {[
            { v: 'standard', l: 'Balanced', s: 'Protein, carbs, fats — flexible and sustainable' },
            { v: 'high_protein', l: 'High Protein', s: 'Protein first, moderate everything else' },
            { v: 'carnivore', l: 'Carnivore / Animal-Based', s: 'Meat, organs, eggs — no plant carbs' },
            { v: 'glp1', l: 'GLP-1 Protocol', s: 'On Ozempic / Wegovy — muscle preservation focus' },
          ].map(o => (
            <Opt key={o.v} label={o.l} sub={o.s}
              selected={data.protocol === o.v}
              onClick={() => update('protocol', o.v)} />
          ))}
        </Block>

      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur border-t border-[#262626] px-5 py-4">
        <button
          onClick={onSubmit}
          disabled={!isComplete || saving}
          className="w-full bg-[#CAFF40] hover:bg-[#A8D930] disabled:opacity-30 text-black font-black py-4 rounded-2xl text-base transition-all"
        >
          {saving ? 'Building your plan...' : `Generate My Plan, ${data.name || 'King'} →`}
        </button>
        {!isComplete && (
          <p className="text-xs text-[#5C5C5C] text-center mt-2">
            Complete all fields to generate your plan
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERATING SCREEN
// ═══════════════════════════════════════════════════════════════
function GeneratingScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-5 text-center">
      <div className="text-5xl mb-6">⚙️</div>
      <h2 className="text-2xl font-black text-[#FFFFFF] mb-3">
        Building Your Plan{name ? `, ${name}` : ''}
      </h2>
      <p className="text-sm text-[#A0A0A0] max-w-xs leading-relaxed mb-2">
        The engine is running your numbers — training split,
        macro targets, adaptation rules — all calibrated to
        exactly what you told us.
      </p>
      <p className="text-xs text-[#5C5C5C] max-w-xs leading-relaxed mb-8">
        This is not a template. Everything is calculated for you specifically.
      </p>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i}
            className="w-2 h-2 rounded-full bg-[#CAFF40] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CHAIN CONTROLLER
// ═══════════════════════════════════════════════════════════════
const EMPTY: ChainData = {
  name: '', honest_start: '', current_feeling: '',
  real_reason: '', identity_word: '', fear: '',
  experience_level: '', past_program: '', quit_reason: '',
  best_moment: '', days_available: 0, energy_window: '', obstacle: '',
  age: '', gender: '', weight: '', weight_unit: 'kg',
  height: '', goal: '', equipment: '', injuries: [], protocol: '',
};

function savedToChain(saved: OnboardingRecord): Partial<ChainData> {
  return {
    age: saved.age != null ? String(saved.age) : '',
    gender: saved.gender ?? '',
    weight: saved.weight_kg != null ? String(saved.weight_kg) : '',
    weight_unit: 'kg',
    height: saved.height_cm != null ? String(saved.height_cm) : '',
    goal: saved.goal ?? '',
    experience_level: saved.experience ?? '',
    days_available: saved.days_per_week ?? 0,
    equipment: saved.equipment ?? '',
    injuries: saved.injuries ?? [],
    protocol: saved.protocol ?? '',
  }
}

export default function OnboardingChain({ onComplete, savedData }: OnboardingChainProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ChainData>(() =>
    savedData ? { ...EMPTY, ...savedToChain(savedData) } : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [planData, setPlanData] = useState<GeneratedPlanData | null>(null);

  const update = (key: keyof ChainData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    try {
      const weight_kg = data.weight_unit === 'lbs'
        ? parseFloat(data.weight) * 0.453592
        : parseFloat(data.weight);

      // Save onboarding data
      // NOTE: onboarding_data has no completed_at/updated_at columns — do not add them
      const { error: oErr } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          age: parseInt(data.age),
          gender: data.gender,
          weight_kg: Math.round(weight_kg * 10) / 10,
          height_cm: parseFloat(data.height),
          goal: data.goal,
          experience: data.experience_level,
          days_per_week: data.days_available,
          equipment: data.equipment,
          injuries: data.injuries,
          protocol: data.protocol,
          allergies: [],
          onboarding_completed: true,
        }, { onConflict: 'user_id' });

      if (oErr) throw oErr;

      // Save mind profile
      const { error: mErr } = await supabase
        .from('mind_profiles')
        .upsert({
          user_id: user.id,
          phase_zero_completed: true,
          phase_zero_day: 3,
          psychological_stage: getPsychStage(data),
          identity_statement: data.identity_word,
          fear_audit: [data.fear],
          energy_peak_window: data.energy_window,
          quit_signals: {
            honest_start: data.honest_start,
            quit_reason: data.quit_reason,
            current_feeling: data.current_feeling,
          },
          mind_score: getMindScore(data),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (mErr) throw mErr;

      // Generate plans
      setSaving(false);
      setGenerating(true);
      const result = await generatePlans(user.id);
      setGenerating(false);
      if (result.success && result.data) {
        setPlanData(result.data);
        // Don't call onComplete yet — PlanReadyScreen does it
      } else {
        setError(result.error || 'Plan generation failed. Please try again.');
      }

    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setSaving(false);
      setGenerating(false);
    }
  };

  // Derive psychological stage from answers
  function getPsychStage(d: ChainData): string {
    if (d.current_feeling === 'ready') return 'preparation';
    if (d.current_feeling === 'numb') return 'contemplation';
    if (d.honest_start === 'many' && d.current_feeling === 'tired') return 'contemplation';
    if (d.honest_start === 'first_time') return 'preparation';
    return 'preparation';
  }

  // Derive mind score from answers
  function getMindScore(d: ChainData): number {
    let score = 50;
    if (d.current_feeling === 'ready') score += 20;
    if (d.current_feeling === 'scared') score -= 5;
    if (d.current_feeling === 'tired') score -= 10;
    if (d.fear === 'nothing') score += 10;
    if (d.honest_start === 'first_time') score += 10;
    if (d.honest_start === 'many') score -= 5;
    return Math.min(100, Math.max(20, score));
  }

  if (planData) {
    return (
      <PlanReadyScreen
        data={planData}
        userName={data.name}
        onStart={onComplete}
      />
    );
  }

  if (generating) return <GeneratingScreen name={data.name} />;

  return (
    <>
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {page === 1 && (
        <Page1 data={data} update={update} onNext={() => setPage(2)} />
      )}
      {page === 2 && (
        <Page2 data={data} update={update} onNext={() => setPage(3)} onPrev={() => setPage(1)} />
      )}
      {page === 3 && (
        <Page3 data={data} update={update} onSubmit={handleSubmit} saving={saving} onPrev={() => setPage(2)} />
      )}
    </>
  );
}
