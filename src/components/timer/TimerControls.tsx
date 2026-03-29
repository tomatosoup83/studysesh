import { Play, Pause, RotateCcw } from 'lucide-react'
import { TimerStatus } from '../../types/timer'
import { useTimerStore } from '../../stores/timerStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface TimerControlsProps { status: TimerStatus }

export function TimerControls({ status }: TimerControlsProps) {
  const { start, pause, reset } = useTimerStore()
  const { timerDurations } = useSettingsStore()

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => reset(timerDurations)}
        className="p-2 rounded-full transition-colors"
        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}
        title="Reset"
      >
        <RotateCcw size={15} />
      </button>
      <button
        onClick={status === 'running' ? pause : start}
        className="flex items-center gap-2 px-7 py-2.5 rounded-full font-semibold text-sm transition-all active:scale-95"
        style={{ background: 'var(--color-primary)', color: 'white', boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent)' }}
      >
        {status === 'running' ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {status === 'idle' ? 'Start' : 'Resume'}</>}
      </button>
    </div>
  )
}
