'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function ChatDisclaimer() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] text-xs text-gray-500 text-center">
      <span className="flex-1">
        AI responses are for informational purposes only. Not a substitute for professional medical advice.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
