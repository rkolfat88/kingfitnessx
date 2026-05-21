import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'gold' | 'green' | 'blue' | 'orange' | 'red'
  className?: string
}

const colorMap = {
  gold:   { bg: 'bg-[#C9A84C]/10',    border: 'border-[#C9A84C]/20',    icon: 'text-[#C9A84C]',  value: 'text-[#C9A84C]' },
  green:  { bg: 'bg-green-500/10',        border: 'border-green-500/20',        icon: 'text-green-400',       value: 'text-green-400' },
  blue:   { bg: 'bg-blue-500/10',         border: 'border-blue-500/20',         icon: 'text-blue-400',        value: 'text-blue-400' },
  orange: { bg: 'bg-orange-500/10',       border: 'border-orange-500/20',       icon: 'text-orange-400',      value: 'text-orange-400' },
  red:    { bg: 'bg-red-500/10',          border: 'border-red-500/20',          icon: 'text-red-400',         value: 'text-red-400' },
}

export function StatCard({
  label, value, unit, icon: Icon, trend, trendValue, color = 'gold', className,
}: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn(
      'bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4',
      'hover:border-[var(--border-gold)] hover:bg-[var(--surface-3)] transition-all duration-200',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', colors.bg, colors.border)}>
            <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className={cn('text-2xl font-bold', colors.value)}>{value}</span>
        {unit && <span className="text-sm text-gray-500 mb-0.5">{unit}</span>}
      </div>
      {trendValue && (
        <p className={cn(
          'text-xs font-medium mt-2',
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </p>
      )}
    </div>
  )
}
