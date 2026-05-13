import { cn } from '@/lib/utils'
import { Crown, User } from 'lucide-react'
import type { Message } from '@/types'

const agentConfig: Record<string, { color: string; label: string }> = {
  workout:        { color: '#3B82F6', label: '💪 Workout Agent'        },
  nutrition:      { color: '#F97316', label: '🥗 Nutrition Agent'      },
  recovery:       { color: '#22C55E', label: '🛌 Recovery Agent'       },
  accountability: { color: '#C9A84C', label: '🔥 Accountability Coach' },
  analysis:       { color: '#8B5CF6', label: '📊 Analysis Agent'       },
  general:        { color: '#C9A84C', label: '👑 King AI Coach'        },
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const agent  = message.agent_type
    ? (agentConfig[message.agent_type] ?? agentConfig.general)
    : agentConfig.general

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 animate-slide-up mb-3">
        <div className="bg-[var(--gold)]/15 border border-[var(--gold)]/25 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-[var(--gold)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 animate-slide-up mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
      >
        <Crown className="w-3.5 h-3.5" style={{ color: agent.color }} />
      </div>
      <div className="max-w-[85%] space-y-1">
        <p className="text-xs font-medium ml-1" style={{ color: agent.color }}>{agent.label}</p>
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center flex-shrink-0">
        <Crown className="w-3.5 h-3.5 text-[var(--gold)]" />
      </div>
      <div className="bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-bl-sm">
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
