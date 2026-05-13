'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyCheckin } from '@/types'

interface WeightChartProps {
  checkins: DailyCheckin[]
}

export function WeightChart({ checkins }: WeightChartProps) {
  const data = checkins
    .filter(c => c.weight_kg !== null)
    .slice()
    .reverse()
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: c.weight_kg,
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        No weight data logged yet. Log your weight in daily check-ins.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#666', fontSize: 11 }}
          axisLine={{ stroke: '#2A2A2A' }}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#666', fontSize: 11 }}
          axisLine={{ stroke: '#2A2A2A' }}
          tickLine={false}
          width={35}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '8px',
            color: '#F5F5F5',
            fontSize: '12px',
          }}
          formatter={(v) => [`${v}kg`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#C9A84C"
          strokeWidth={2}
          dot={{ fill: '#C9A84C', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#E8C76A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
