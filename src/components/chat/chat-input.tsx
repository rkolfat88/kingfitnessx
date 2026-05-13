'use client'

import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-3">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your coach anything..."
        rows={1}
        className={cn(
          'flex-1 resize-none px-4 py-3 rounded-xl text-sm',
          'bg-[var(--surface-2)] border border-[var(--border)] text-white placeholder:text-gray-600',
          'focus:outline-none focus:border-[var(--gold)]/50 focus:ring-1 focus:ring-[var(--gold)]/30',
          'transition-all duration-200 max-h-32 scrollbar-none'
        )}
        style={{ height: 'auto', minHeight: '48px' }}
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
          'bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black',
          'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
