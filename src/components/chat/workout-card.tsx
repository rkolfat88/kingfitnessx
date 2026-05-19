import type { WorkoutCardData } from '@/types'

export function WorkoutCard({ data }: { data: WorkoutCardData }) {
  return (
    <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 w-full">

      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-base font-semibold text-white flex-1">{data.focus}</p>
        <span className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 px-2 py-0.5 rounded-full">
          {data.total_sets} sets
        </span>
        <span className="text-xs bg-[#242424] text-[#909090] px-2 py-0.5 rounded-full">
          {data.duration_minutes} min
        </span>
      </div>

      <div className="h-px bg-[#242424] my-3" />

      {/* Exercises */}
      <div>
        {data.exercises.map((ex, i) => (
          <div
            key={i}
            className={`py-2.5 ${i < data.exercises.length - 1 ? 'border-b border-[#242424]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <p className="text-sm text-white flex-1">{ex.name}</p>
              <span className="text-sm text-[#C9A84C] font-semibold whitespace-nowrap">
                {ex.sets} × {ex.reps}
              </span>
              {ex.rpe !== undefined && (
                <span className="text-xs bg-[#242424] px-2 py-0.5 rounded-full text-[#909090] whitespace-nowrap">
                  RPE {ex.rpe}
                </span>
              )}
            </div>
            {(ex.rest_seconds !== undefined || ex.notes) && (
              <p className="text-xs text-[#505050] mt-0.5">
                {ex.rest_seconds !== undefined ? `${ex.rest_seconds}s rest` : ''}
                {ex.rest_seconds !== undefined && ex.notes ? ' · ' : ''}
                {ex.notes ?? ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
