'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ScoreRow {
  score_date: string
  recovery_score:   number | null
  adherence_score:  number | null
  momentum_score:   number | null
  discipline_rating: number | null
}

interface ScoreTrendChartProps {
  scores: ScoreRow[]
}

export function ScoreTrendChart({ scores }: ScoreTrendChartProps) {
  const data = scores.map(s => ({
    date: new Date(s.score_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Recovery:   s.recovery_score   ?? undefined,
    Adherence:  s.adherence_score  ?? undefined,
    Momentum:   s.momentum_score   ?? undefined,
    Discipline: s.discipline_rating ?? undefined,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No performance data yet. Complete your first daily check-in.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#666', fontSize: 10 }}
          axisLine={{ stroke: '#2A2A2A' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#666', fontSize: 10 }}
          axisLine={{ stroke: '#2A2A2A' }}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '8px',
            color: '#F5F5F5',
            fontSize: '12px',
          }}
          formatter={(v) => [`${v}`, '']}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#888' }}
          iconType="circle"
          iconSize={8}
        />
        <Line type="monotone" dataKey="Recovery"   stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Adherence"  stroke="#C9A84C" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Momentum"   stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Discipline" stroke="#F97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
