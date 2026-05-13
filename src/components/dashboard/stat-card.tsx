import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  highlight?: boolean
}

export function StatCard({ label, value, sub, icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-[var(--gold)]/30 bg-[var(--gold)]/5' : ''}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-[var(--gold)]' : 'text-white'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${highlight ? 'bg-[var(--gold)]/10' : 'bg-[var(--surface-2)]'}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
