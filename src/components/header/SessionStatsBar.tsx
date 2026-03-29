import { Clock, Target, CheckSquare, Zap } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { formatDuration, intervalToDuration } from 'date-fns'

export function SessionStatsBar() {
  const { isActive, totalFocusSeconds, pomodorosCompleted, tasksCompletedIds } = useSessionStore()
  if (!isActive) return null

  const dur = intervalToDuration({ start: 0, end: totalFocusSeconds * 1000 })
  const focusTime = formatDuration(dur, { format: ['hours', 'minutes'] }) || '0 min'

  return (
    <div
      className="flex items-center justify-center gap-6 px-6 py-1.5 text-xs border-b flex-shrink-0"
      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
    >
      <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--color-success)' }}>
        <Zap size={11} /> Session Active
      </span>
      <span className="flex items-center gap-1"><Clock size={10} /> {focusTime} focused</span>
      <span className="flex items-center gap-1"><Target size={10} /> {pomodorosCompleted} pomodoros</span>
      <span className="flex items-center gap-1"><CheckSquare size={10} /> {tasksCompletedIds.length} tasks done</span>
    </div>
  )
}
