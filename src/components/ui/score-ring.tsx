interface ScoreRingProps {
  score: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export function ScoreRing({
  score,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = '#C9A84C',
  label,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(score / max, 1)
  const strokeDashoffset = circumference - percentage * circumference

  const getAutoColor = () => {
    if (score >= 80) return '#22C55E'
    if (score >= 60) return '#C9A84C'
    if (score >= 40) return '#F97316'
    return '#EF4444'
  }

  const ringColor = color === 'auto' ? getAutoColor() : color

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out score-ring"
            style={{ color: ringColor }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      {label && <p className="text-xs font-medium text-white">{label}</p>}
    </div>
  )
}
