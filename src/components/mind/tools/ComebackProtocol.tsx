import React, { useState } from 'react';
import { ChevronLeft, Shield } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    tag: 'COUNT',
    heading: 'How many times did you show up?',
    body: 'Before this gap — count the sessions you actually completed. Not the ones you planned. The ones that happened.\n\nThose are permanent. The gap is temporary data.',
    cta: "I've counted them.",
  },
  {
    tag: 'NAME IT',
    heading: 'What happened — one sentence.',
    body: 'No story. No justification. Just the fact.\n\n"I missed [X] days because [one honest reason]."\n\nSay it internally. Own it. That\'s the whole step.',
    cta: "I've named it.",
  },
  {
    tag: 'REFRAME',
    heading: 'The gap is data, not failure.',
    body: 'Your body adapted to rest. Your nervous system tested a boundary. Your mind checked whether this identity is real.\n\nAll three responses are normal. None of them mean you quit.',
    cta: 'Understood.',
  },
  {
    tag: 'ACT',
    heading: 'One set. Right now.',
    body: 'Not a comeback session. Not a full workout. One set of anything — squat, push-up, deadlift.\n\nThe protocol ends when you move once. The streak restarts from this moment.',
    cta: 'Protocol complete — back to Mind Gym',
  },
];

export default function ComebackProtocol({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const advance = () => {
    if (isLast) onClose();
    else setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors active:scale-95 flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#3B82F6]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#3B82F6]">
            Comeback Protocol
          </span>
        </div>
      </div>

      <div className="px-5 flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= step ? '#3B82F6' : '#262626' }}
          />
        ))}
      </div>

      <div className="flex-1 px-5 flex flex-col justify-center">
        <p className="font-mono text-xs font-bold tracking-widest mb-5 text-[#3B82F6]">
          {String(step + 1).padStart(2, '0')} — {current.tag}
        </p>
        <h2 className="font-display text-2xl font-black text-[#FFFFFF] leading-tight mb-6">
          {current.heading}
        </h2>
        <p className="text-[#A0A0A0] text-base leading-relaxed whitespace-pre-line">
          {current.body}
        </p>
      </div>

      <div className="px-5 pb-10">
        <button
          onClick={advance}
          className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all active:opacity-80"
          style={{ backgroundColor: '#3B82F6' }}
        >
          {current.cta}
        </button>
      </div>
    </div>
  );
}
