import React from 'react'
import { ChevronLeft } from 'lucide-react'

interface HeaderBarProps {
  onBack?: () => void
  onAvatarPress?: () => void
  userInitials?: string
  title?: string
  transparent?: boolean
}

export function HeaderBar({ onBack, onAvatarPress, userInitials, title, transparent }: HeaderBarProps) {
  return (
    <div className={`flex items-center justify-between px-5 pt-12 pb-4 ${transparent ? '' : ''}`}>
      {/* Left — back or spacer */}
      <div className="w-10">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#8899BB] hover:text-[#F0F4FF] transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Center — optional title */}
      {title ? (
        <p className="text-xs font-bold uppercase tracking-widest text-[#8899BB]">{title}</p>
      ) : (
        <div />
      )}

      {/* Right — avatar or spacer */}
      <div className="w-10 flex justify-end">
        {onAvatarPress ? (
          <button
            onClick={onAvatarPress}
            className="w-9 h-9 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center transition-all active:scale-95 hover:bg-[#C9A84C]/25"
          >
            <span className="text-xs font-black text-[#C9A84C] tracking-tight">
              {userInitials || 'K'}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
