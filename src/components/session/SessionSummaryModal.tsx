import { Clock, Target, CheckCircle } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { Modal } from '../ui/Modal'
import { formatDuration, intervalToDuration } from 'date-fns'

export function SessionSummaryModal() {
  const { summary, dismissSummary } = useSessionStore()
  if (!summary) return null

  const dur = intervalToDuration({ start: 0, end: summary.totalFocusSeconds * 1000 })
  const focusTime = formatDuration(dur, { format: ['hours', 'minutes'] }) || '< 1 min'

  return (
    <Modal open onClose={dismissSummary} title="Session Summary" size="sm">
      <div className="space-y-4">
        <div className="text-center py-2">
          <div className="text-3xl mb-1">🎉</div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Great work! Here's your session.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Clock, label: 'Focus Time', value: focusTime, color: 'var(--color-primary)' },
            { icon: Target, label: 'Pomodoros', value: String(summary.pomodorosCompleted), color: 'var(--color-accent)' },
            { icon: CheckCircle, label: 'Tasks Done', value: String(summary.tasksCompleted), color: 'var(--color-success)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <Icon size={16} style={{ color, margin: '0 auto 4px' }} />
              <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
        <button onClick={dismissSummary} className="w-full py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--color-primary)', color: 'white' }}>
          Done
        </button>
      </div>
    </Modal>
  )
}
