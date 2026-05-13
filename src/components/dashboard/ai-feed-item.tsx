import { cn } from '@/lib/utils'

interface AIFeedItemProps {
  message: string
  type: 'info' | 'success' | 'warning' | 'insight'
  time?: string
}

const typeConfig = {
  info:    { border: 'border-blue-500/20',   bg: 'bg-blue-500/5',   dot: 'bg-blue-400',           text: 'text-blue-300'  },
  success: { border: 'border-green-500/20',  bg: 'bg-green-500/5',  dot: 'bg-green-400',          text: 'text-green-300' },
  warning: { border: 'border-orange-500/20', bg: 'bg-orange-500/5', dot: 'bg-orange-400',         text: 'text-orange-300'},
  insight: { border: 'border-[var(--gold)]/20', bg: 'bg-[var(--gold)]/5', dot: 'bg-[var(--gold)]', text: 'text-[var(--gold)]' },
}

export function AIFeedItem({ message, type, time }: AIFeedItemProps) {
  const config = typeConfig[type]
  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl border', config.bg, config.border)}>
      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', config.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', config.text)}>{message}</p>
        {time && <p className="text-xs text-gray-600 mt-0.5">{time}</p>}
      </div>
    </div>
  )
}
