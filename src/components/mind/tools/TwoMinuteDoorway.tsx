import React, { useState, useEffect } from 'react';
import { X, Zap, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const MOVES = [
  { label: '10 shoulder rolls', detail: '5 each side — slow and full' },
  { label: '10 hip circles', detail: '5 each direction — loosen the hips' },
  { label: '10 bodyweight squats', detail: 'Slow descent, full depth, push through the heels' },
];

const TOTAL = 120;

export default function TwoMinuteDoorway({ onClose }: Props) {
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(TOTAL);
  const [completed, setCompleted] = useState([false, false, false]);

  useEffect(() => {
    if (!started || seconds === 0) return;
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [started, seconds]);

  const toggleMove = (i: number) => {
    if (!started) return;
    setCompleted(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const allDone = completed.every(Boolean) || seconds === 0;
  const circumference = 2 * Math.PI * 52;
  const elapsed = TOTAL - seconds;
  const pct = elapsed / TOTAL;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-[#070B14] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#22C55E]">
            2-Minute Doorway
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[#8899BB]" />
        </button>
      </div>

      <div className="flex flex-col items-center pt-4 pb-8">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#0D1F0D" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={seconds === 0 ? '#22C55E' : '#22C55E'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              style={{ transition: started ? 'stroke-dashoffset 1s linear' : undefined }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {seconds === 0 ? (
              <span className="font-mono text-lg font-black text-[#22C55E]">Done</span>
            ) : (
              <span className="font-mono text-3xl font-black text-[#F0F4FF]">
                {mins}:{String(secs).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {!started && (
          <p className="text-sm text-[#8899BB] mt-4 text-center px-8">
            Stand where you are. No equipment. No warm-up.
          </p>
        )}
      </div>

      <div className="flex-1 px-5 space-y-3">
        {MOVES.map((move, i) => (
          <button
            key={i}
            onClick={() => toggleMove(i)}
            disabled={!started}
            className="w-full bg-[#111827] rounded-xl p-4 flex items-center gap-3 text-left transition-all disabled:opacity-50"
            style={{ border: `1px solid ${completed[i] ? '#22C55E' : '#1E2D40'}` }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ backgroundColor: completed[i] ? '#22C55E' : '#0D1F0D' }}
            >
              {completed[i]
                ? <Check className="w-3.5 h-3.5 text-black" />
                : <span className="text-xs font-mono font-bold text-[#8899BB]">{i + 1}</span>
              }
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: completed[i] ? '#22C55E' : '#F0F4FF' }}>
                {move.label}
              </p>
              <p className="text-xs text-[#8899BB]">{move.detail}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="px-5 pb-10 pt-4">
        {allDone ? (
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl font-bold text-sm text-black bg-[#22C55E] active:opacity-80"
          >
            You started. Back to Mind Gym.
          </button>
        ) : !started ? (
          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 rounded-xl font-bold text-sm text-black bg-[#22C55E] active:opacity-80"
          >
            Start the 2 minutes
          </button>
        ) : (
          <p className="text-center text-xs text-[#445577]">
            Tap each move as you complete it
          </p>
        )}
      </div>
    </div>
  );
}
