import React, { useState } from 'react';
import { Crown, X } from 'lucide-react';

interface TrialSoftPromptProps {
  daysLeft: number;
  onUpgrade?: () => void;
}

// Soft upgrade nudge shown at day 14 (7 left) and day 19 (2 left) of the
// 21-day trial. Dismissible for the session — not persisted, so it
// reappears next launch rather than being silenced forever by one tap.
export function TrialSoftPrompt({ daysLeft, onUpgrade }: TrialSoftPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgent = daysLeft <= 2;

  return (
    <div className={`flex items-center gap-3 rounded-2xl p-4 border ${urgent ? 'bg-[#EF4444]/[0.06] border-[#EF4444]/25' : 'bg-[#CAFF40]/[0.06] border-[#CAFF40]/20'}`}>
      <Crown className={`w-5 h-5 flex-shrink-0 ${urgent ? 'text-[#EF4444]' : 'text-[#CAFF40]'}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#FFFFFF]">
          {urgent ? `${daysLeft} days left — lock in your progress` : `${daysLeft} days left in your trial`}
        </p>
        <p className="text-xs text-[#A0A0A0]">Upgrade now to keep logging, Coach chat, and your plans.</p>
      </div>
      <button onClick={onUpgrade} className="text-xs font-bold uppercase tracking-wide text-[#CAFF40] px-2">
        Upgrade
      </button>
      <button onClick={() => setDismissed(true)} className="text-[#5C5C5C]">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
