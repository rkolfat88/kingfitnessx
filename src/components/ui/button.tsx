import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white border border-[var(--border)]',
    gold: 'bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-semibold border border-[var(--gold)]',
    outline: 'bg-transparent hover:bg-[var(--surface-2)] text-white border border-[var(--border)]',
    ghost: 'bg-transparent hover:bg-[var(--surface-2)] text-white border-0',
    destructive: 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
