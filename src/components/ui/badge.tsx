import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--surface-3)] text-gray-300 border-[var(--border)]',
    gold: 'bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30',
    success: 'bg-green-900/20 text-green-400 border-green-900/50',
    warning: 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50',
    danger: 'bg-red-900/20 text-red-400 border-red-900/50',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
