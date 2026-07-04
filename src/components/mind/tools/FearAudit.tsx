import React, { useState } from 'react';
import { ChevronLeft, Target } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const QUESTIONS = [
  {
    q: 'What are you specifically avoiding?',
    sub: 'Not "the gym." Name the exact moment — the first set of a heavy lift, the feeling of being winded, one specific exercise. What is the precise thing?',
    prompt: 'The specific thing I\'m avoiding is...',
  },
  {
    q: 'If you trained today and it went badly — what would that mean about you?',
    sub: 'Follow the thought to its conclusion. "It would mean I am..." — say the thing you\'re protecting against. Don\'t stop at "I\'d feel bad."',
    prompt: 'If it goes badly, that means I am...',
  },
  {
    q: 'Is that interpretation actually true?',
    sub: 'Not "is it possible." Is it the most honest reading of the evidence? Or is it a story you\'ve been protecting because it keeps you safe from trying?',
    prompt: 'Honestly...',
  },
];

export default function FearAudit({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [showReframe, setShowReframe] = useState(false);

  const advance = () => {
    if (step < QUESTIONS.length - 1) setStep(s => s + 1);
    else setShowReframe(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#000000' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#A0A0A0] hover:text-[#FFFFFF] hover:border-[#3A3A3A] transition-colors active:scale-95 flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#F97316]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#F97316]">
            Fear Audit
          </span>
        </div>
      </div>

      {!showReframe ? (
        <>
          <div className="px-5 flex gap-2 mb-10">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= step ? '#F97316' : '#262626' }}
              />
            ))}
          </div>

          <div className="flex-1 px-5 flex flex-col justify-center">
            <p className="font-mono text-xs font-bold tracking-widest mb-5 text-[#F97316]">
              QUESTION {step + 1} OF {QUESTIONS.length}
            </p>
            <h2 className="font-display text-2xl font-black leading-tight mb-5" style={{ color: '#FFFFFF' }}>
              {QUESTIONS[step].q}
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#A0A0A0' }}>
              {QUESTIONS[step].sub}
            </p>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#0D0D0D', border: '1px solid #F9731628' }}
            >
              <p className="text-xs text-[#F97316] mb-2">{QUESTIONS[step].prompt}</p>
              <p className="text-sm" style={{ color: '#5C5C5C' }}>
                Answer this honestly — aloud, in writing, or in your head. Take the time it needs.
              </p>
            </div>
          </div>

          <div className="px-5 pb-10">
            <button
              onClick={advance}
              className="w-full py-4 rounded-xl font-bold text-sm text-black active:opacity-80"
              style={{ backgroundColor: '#F97316' }}
            >
              {step < QUESTIONS.length - 1 ? 'I answered that honestly.' : 'I answered all three.'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 px-5 flex flex-col justify-center gap-4">
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#0D0D0D', border: '1px solid #F9731630' }}
            >
              <p className="font-mono text-xs font-bold tracking-widest text-[#F97316] mb-4">REFRAME</p>
              <p className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                Fear is always about the story, not the thing. The exercise, the session, the difficulty — all neutral. The story is what gives it power.
              </p>
              <p className="text-base leading-relaxed mt-3" style={{ color: '#FFFFFF' }}>
                You just identified the story. That means you can change it.
              </p>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#000000', border: '1px solid #F97316' }}
            >
              <p className="font-mono text-xs font-bold tracking-widest text-[#F97316] mb-4">ACTION</p>
              <p className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                The specific thing you named in Question 1 goes{' '}
                <span className="font-bold text-[#F97316]">first</span> in your next session.
                Not last. Not when you feel ready. First.
              </p>
            </div>
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-bold text-sm text-black active:opacity-80"
              style={{ backgroundColor: '#F97316' }}
            >
              Audit complete — back to Mind Gym
            </button>
          </div>
        </>
      )}
    </div>
  );
}
