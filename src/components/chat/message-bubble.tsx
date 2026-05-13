import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { AgentType } from '@/types'

const agentLabels: Record<AgentType, string> = {
  workout: 'Workout Agent',
  nutrition: 'Nutrition Agent',
  recovery: 'Recovery Agent',
  accountability: 'Coach',
  analysis: 'Analysis Agent',
  general: 'King AI Coach',
}

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  agentType?: AgentType
}

export function MessageBubble({ role, content, agentType }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs">👑</span>
        </div>
      )}
      <div className={cn('max-w-[75%] space-y-1.5', isUser ? 'items-end flex flex-col' : '')}>
        {!isUser && agentType && (
          <Badge variant="gold" className="text-xs">{agentLabels[agentType]}</Badge>
        )}
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-white rounded-tr-sm'
            : 'bg-[var(--surface-2)] border border-[var(--border)] text-gray-200 rounded-tl-sm'
        )}>
          {content}
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs">👑</span>
      </div>
      <div className="bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
