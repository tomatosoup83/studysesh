import { useTimerStore } from '../../stores/timerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTaskStore } from '../../stores/taskStore'
import { getModeLabel, getModeColor } from '../../lib/pomodoroLogic'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { TimerSettings } from './TimerSettings'
import { TimerMode } from '../../types/timer'

const MODES: TimerMode[] = ['pomodoro', 'short-break', 'long-break']

export function PomodoroTimer() {
  const { mode, status, secondsRemaining, pomodorosCompletedInSession, activeTaskId, setMode } = useTimerStore()
  const { timerDurations } = useSettingsStore()
  const { tasks } = useTaskStore()

  const totalSeconds = { pomodoro: timerDurations.pomodoro, 'short-break': timerDurations.shortBreak, 'long-break': timerDurations.longBreak }[mode]
  const activeTask = activeTaskId ? tasks[activeTaskId] : null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mode tabs */}
      <div className="flex items-center gap-1.5 w-full justify-center">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m, timerDurations)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color: mode === m ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {getModeLabel(m)}
          </button>
        ))}
        <TimerSettings />
      </div>

      <TimerDisplay secondsRemaining={secondsRemaining} totalSeconds={totalSeconds} mode={mode} />

      <TimerControls status={status} />

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span style={{ color: getModeColor(mode) }}>🍅 ×{pomodorosCompletedInSession}</span>
        {activeTask && (
          <span style={{ color: 'var(--color-primary)' }} className="truncate max-w-[150px]" title={activeTask.title}>
            ▶ {activeTask.title}
          </span>
        )}
      </div>
    </div>
  )
}
