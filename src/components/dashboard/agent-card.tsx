import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AgentCardProps {
  name: string
  role: string
  icon: LucideIcon
  status: 'active' | 'standby' | 'alert'
  lastAction?: string
  color?: string
  onClick?: () => void
}

const statusConfig = {
  active:  { dot: 'bg-green-400',                     text: 'Active'  },
  standby: { dot: 'bg-gray-500',                      text: 'Standby' },
  alert:   { dot: 'bg-orange-400 animate-pulse',      text: 'Alert'   },
}

export function AgentCard({
  name, role, icon: Icon, status, lastAction, color = '#C9A84C', onClick,
}: AgentCardProps) {
  const s = statusConfig[status]
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--gold)]/30 hover:bg-[var(--surface-3)] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-base font-semibold text-white">{name}</p>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
              <span className="text-xs text-gray-500">{s.text}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{role}</p>
          {lastAction && (
            <p className="text-xs text-gray-600 mt-1.5 truncate">{lastAction}</p>
          )}
        </div>
      </div>
    </button>
  )
}
