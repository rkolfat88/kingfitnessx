import type { ScoreCardData } from '@/types'

function autoColor(value: number): string {
  if (value >= 80) return '#22C55E'
  if (value >= 60) return '#C9A84C'
  if (value >= 40) return '#F97316'
  return '#EF4444'
}

export function ScoreCard({ data }: { data: ScoreCardData }) {
  return (
    <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 w-full">
      <div className="flex gap-3 flex-wrap">
        {data.scores.map((score, i) => (
          <div
            key={i}
            className="flex-1 min-w-[60px] bg-[#1A1A1A] rounded-xl p-2.5 text-center border border-[#242424]"
          >
            <p
              className="text-lg font-bold"
              style={{ color: score.color || autoColor(score.value) }}
            >
              {score.value}
            </p>
            <p className="text-[10px] text-[#505050] mt-0.5">{score.label}</p>
          </div>
        ))}
      </div>
      {data.summary && (
        <p className="text-sm text-[#909090] mt-3">{data.summary}</p>
      )}
    </div>
  )
}
