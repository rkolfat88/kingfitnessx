import React from 'react'
import { ChevronLeft } from 'lucide-react'

interface HeaderBarProps {
  onBack?: () => void
  onAvatarPress?: () => void
  userInitials?: string
  title?: string
  transparent?: boolean
  trialDaysLeft?: number | null
}

export function HeaderBar({ onBack, onAvatarPress, userInitials, title, transparent, trialDaysLeft }: HeaderBarProps) {
  return (
    <div className={`flex items-center justify-between px-5 pt-12 pb-4 ${transparent ? '' : ''}`}>
      {/* Left — back or spacer */}
      <div className="w-10">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#A0A0A0] hover:text-[#FFFFFF] hover:border-[#3A3A3A] transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Center — title, or trial days-left badge */}
      {title ? (
        <p className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">{title}</p>
      ) : trialDaysLeft != null ? (
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#CAFF40] bg-[#CAFF40]/10 border border-[#CAFF40]/25 rounded-full px-3 py-1">
          {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left in trial
        </span>
      ) : (
        <div />
      )}

      {/* Right — avatar or spacer */}
      <div className="w-10 flex justify-end">
        {onAvatarPress ? (
          <button
            onClick={onAvatarPress}
            className="w-9 h-9 rounded-full bg-[#CAFF40]/15 border border-[#CAFF40]/30 flex items-center justify-center transition-all active:scale-95 hover:bg-[#CAFF40]/25"
          >
            <span className="text-xs font-black text-[#CAFF40] tracking-tight">
              {userInitials || 'K'}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
