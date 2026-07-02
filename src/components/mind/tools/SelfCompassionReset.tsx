import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const BEATS = [
  {
    heading: 'Something went wrong.\nThat\'s real.',
    body: "Don't skip past this. Acknowledge it. A missed week, a bad session, a visible regression — whatever happened, it happened. Name it once, without elaboration.",
    cta: 'Acknowledged.',
  },
  {
    heading: "You're still here.\nThat's also real.",
    body: "The version of you who opened this app, who's reading this right now — they didn't walk away. That's not a small thing. That's the whole variable.",
    cta: 'Understood.',
  },
  {
    heading: 'Self-criticism has never produced performance.',
    body: 'Every serious athlete knows this. Punishment produces paralysis or rebellion. Neither one gets you back in the gym. The people who last are the ones who close loops and move on.',
    cta: 'True.',
  },
];

const PROTOCOL_STEPS = [
  'Accept what happened. Say it once — "I missed [X]. That happened." Don\'t elaborate.',
  'Name one thing you\'ll do differently. One specific, actionable change.',
  'Close the loop. The bad session ends here. The next one starts clean.',
];

export default function SelfCompassionReset({ onClose }: Props) {
  const [beat, setBeat] = useState(0);
  const [showProtocol, setShowProtocol] = useState(false);
  const [protocolStep, setProtocolStep] = useState(0);

  const advanceBeat = () => {
    if (beat < BEATS.length - 1) setBeat(b => b + 1);
    else setShowProtocol(true);
  };

  const advanceProtocol = () => {
    if (protocolStep < PROTOCOL_STEPS.length - 1) setProtocolStep(s => s + 1);
    else onClose();
  };

  const allBeats = [...Array(BEATS.length).keys()];
  const progress = showProtocol ? BEATS.length : beat;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#080800' }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">
            Self-Compassion Reset
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#1A1600' }}
        >
          <X className="w-4 h-4 text-[#8899BB]" />
        </button>
      </div>

      <div className="px-5 flex gap-2 mb-10">
        {[...allBeats, 'protocol'].map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ backgroundColor: i <= progress ? '#C9A84C' : '#2A2200' }}
          />
        ))}
      </div>

      {!showProtocol ? (
        <>
          <div className="flex-1 px-5 flex flex-col justify-center">
            <h2
              className="font-display text-3xl font-black leading-tight mb-6 whitespace-pre-line"
              style={{ color: '#FFF8E0' }}
            >
              {BEATS[beat].heading}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#887744' }}>
              {BEATS[beat].body}
            </p>
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={advanceBeat}
              className="w-full py-4 rounded-xl font-bold text-sm text-black active:opacity-80 bg-[#C9A84C]"
            >
              {BEATS[beat].cta}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 px-5 flex flex-col justify-center">
            <p className="font-mono text-xs font-bold tracking-widest text-[#C9A84C] mb-6">
              THE PROTOCOL
            </p>
            <div className="space-y-3">
              {PROTOCOL_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 transition-all duration-300"
                  style={{
                    backgroundColor: i <= protocolStep ? '#1A1500' : '#080800',
                    border: `1px solid ${i <= protocolStep ? '#C9A84C40' : '#2A2200'}`,
                    opacity: i > protocolStep ? 0.35 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="font-mono text-xs font-bold mt-0.5 flex-shrink-0"
                      style={{ color: i <= protocolStep ? '#C9A84C' : '#554433' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: i <= protocolStep ? '#FFF8E0' : '#554433' }}
                    >
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={advanceProtocol}
              className="w-full py-4 rounded-xl font-bold text-sm text-black active:opacity-80 bg-[#C9A84C]"
            >
              {protocolStep < PROTOCOL_STEPS.length - 1 ? 'Done.' : 'Loop closed. Back to Mind Gym.'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
