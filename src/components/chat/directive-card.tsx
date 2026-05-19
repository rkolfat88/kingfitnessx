import { Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import type { DirectiveCardData } from '@/types'

const severityConfig = {
  info: {
    Icon:  Info,
    color: '#3B82F6',
    badge: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  },
  warning: {
    Icon:  AlertTriangle,
    color: '#F97316',
    badge: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
  },
  critical: {
    Icon:  AlertOctagon,
    color: '#EF4444',
    badge: 'bg-red-900/30 text-red-400 border-red-800/30',
  },
} as const

export function DirectiveCard({ data }: { data: DirectiveCardData }) {
  const { Icon, color, badge } = severityConfig[data.severity]

  return (
    <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 w-full">

      {/* Icon + severity badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${badge}`}>
          {data.severity}
        </span>
      </div>

      {/* Directives list */}
      <ul className="space-y-1.5 mb-3">
        {data.directives.map((directive, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white">
            <span className="text-[#505050] mt-0.5 flex-shrink-0">•</span>
            <span>{directive}</span>
          </li>
        ))}
      </ul>

      {/* Action */}
      {data.action && (
        <p className="text-sm text-[#C9A84C] font-semibold">{data.action}</p>
      )}
    </div>
  )
}
