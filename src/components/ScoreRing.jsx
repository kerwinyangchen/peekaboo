import { cn } from '../lib/utils'

const SIZE   = 80
const STROKE = 6
const R      = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

function scoreColor(score) {
  if (score >= 90) return '#1A6B3C'  // dark green
  if (score >= 60) return '#9B7A2F'  // muted amber
  return '#D0021B'                   // NYT red
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 60) return 'Needs work'
  return 'Critical'
}

export function ScoreRing({ score, size = 80, className }) {
  const strokeDashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
  const color = scoreColor(score)

  return (
    <figure
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Accessibility score: ${score}%. ${scoreLabel(score)}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="#E2E2E2" strokeWidth={STROKE}
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span
          className="font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: size * 0.25, color }}
        >
          {score}
        </span>
        <span className="leading-none text-[#9B9B9B]" style={{ fontSize: size * 0.1 }}>
          / 100
        </span>
      </div>
    </figure>
  )
}

export function ScoreBar({ score, className }) {
  const color = scoreColor(score)
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score ${score}%`}
    >
      <div className="h-1.5 rounded-full overflow-hidden flex-1 bg-[#E2E2E2]" aria-hidden="true">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-[#444444] w-8 text-right">
        {score}%
      </span>
    </div>
  )
}
