import { TimerMode } from '../../types/timer'
import { getModeColor } from '../../lib/pomodoroLogic'

interface TimerDisplayProps {
  secondsRemaining: number
  totalSeconds: number
  mode: TimerMode
}

export function TimerDisplay({ secondsRemaining, totalSeconds, mode }: TimerDisplayProps) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 1
  const color = getModeColor(mode)

  const SIZE = 180
  const STROKE = 7
  const R = (SIZE - STROKE * 2) / 2
  const CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - progress)

  return (
    <div className="flex items-center justify-center relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--color-border)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
        />
      </svg>
      <span
        className="tabular-nums font-bold"
        style={{ fontSize: '2.6rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
