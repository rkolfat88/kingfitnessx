import type { NutritionCardData } from '@/types'

export function NutritionCard({ data }: { data: NutritionCardData }) {
  const macros = [
    { label: 'Calories', value: String(data.calories)        },
    { label: 'Protein',  value: `${data.protein_g}g`         },
    { label: 'Carbs',    value: `${data.carbs_g}g`           },
    { label: 'Fat',      value: `${data.fat_g}g`             },
  ]

  return (
    <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 w-full">

      {/* Macro grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {macros.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#242424] my-3" />

      {/* Protocol badge */}
      {data.protocol && (
        <div className="mb-3">
          <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-2.5 py-1 rounded-full">
            {data.protocol}
          </span>
        </div>
      )}

      {/* Meals */}
      <div className="space-y-3">
        {data.meals.map((meal, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-0.5">
              <div>
                <span className="text-sm font-semibold text-white">{meal.name}</span>
                <span className="text-xs text-[#505050] ml-2">{meal.time}</span>
              </div>
              <span className="text-sm font-semibold text-[#C9A84C]">{meal.calories} kcal</span>
            </div>
            <p className="text-xs text-[#909090]">{meal.foods.join(', ')}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {data.notes && (
        <>
          <div className="h-px bg-[#242424] my-3" />
          <p className="text-xs text-[#505050] italic">{data.notes}</p>
        </>
      )}
    </div>
  )
}
