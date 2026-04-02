import { useState } from 'react'
import { Play, Square, Clock, Coffee, Target, CheckSquare, Trophy, ChevronUp } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { useTimerStore } from '../../stores/timerStore'
import { useScoreboardStore } from '../../stores/scoreboardStore'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'
import { formatDuration, intervalToDuration } from 'date-fns'

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const dur = intervalToDuration({ start: 0, end: seconds * 1000 })
  return formatDuration(dur, { format: ['hours', 'minutes'] }) || '0 min'
}

export function SessionTracker({ onToggleHide }: { onToggleHide?: () => void }) {
  const {
    isActive, startSession, endSession,
    totalFocusSeconds, idleSeconds, pomodorosCompleted, tasksCompletedIds,
  } = useSessionStore()
  const { status } = useTimerStore()
  const { openScoreboard } = useScoreboardStore()
  const { user } = useAuthStore()
  const userName = user?.displayName ?? null

  const [goalMins, setGoalMins] = useState<number | null>(null)
  const [goalInput, setGoalInput] = useState('')
  const [showGoalInput, setShowGoalInput] = useState(false)

  // Load goal on mount
  useState(() => {
    if (userName) {
      api.getGoal(userName).then((r) => setGoalMins(r.dailyFocusMins)).catch(() => {})
    }
  })

  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const mins = parseInt(goalInput, 10)
    if (!isNaN(mins) && mins > 0 && userName) {
      api.setGoal(userName, mins).then((r) => {
        setGoalMins(r.dailyFocusMins)
        setShowGoalInput(false)
        setGoalInput('')
      }).catch(() => {})
    }
  }

  const isIdling = isActive && status !== 'running'
  const focusMinsToday = Math.round(totalFocusSeconds / 60)

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-panel-bg)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}
          />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Session
          </h2>
          {isActive && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                color: 'var(--color-success)',
              }}
            >
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleHide && (
            <button
              onClick={onToggleHide}
              title="Collapse session panel"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <ChevronUp size={14} />
            </button>
          )}
          <button
            onClick={openScoreboard}
            title="Scoreboard"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <Trophy size={14} />
          </button>
          <button
            onClick={() => setShowGoalInput((v) => !v)}
            title="Set daily goal"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: showGoalInput ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = showGoalInput ? 'var(--color-primary)' : 'var(--color-text-muted)')}
          >
            <Target size={14} />
          </button>
          <button
            onClick={() => isActive ? endSession() : startSession()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: isActive ? 'var(--color-danger)' : 'var(--color-primary)',
              color: 'white',
            }}
          >
            {isActive ? <><Square size={11} /> End</> : <><Play size={11} /> Start</>}
          </button>
        </div>
      </div>

      {/* Goal input popover */}
      {showGoalInput && (
        <form
          onSubmit={handleSetGoal}
          className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Daily goal (min):</span>
          <input
            autoFocus
            type="number"
            min={1}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder={String(goalMins ?? 120)}
            className="w-16 px-2 py-0.5 rounded text-xs outline-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <button type="submit" className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-primary)', color: 'white' }}>
            Save
          </button>
        </form>
      )}

      {/* Goal progress bar */}
      {goalMins && isActive && (
        <div className="px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>Today's goal</span>
            <span>{focusMinsToday} / {goalMins} min</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((focusMinsToday / goalMins) * 100, 100)}%`,
                background: focusMinsToday >= goalMins ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {isActive ? (
        <div className="flex-1 flex flex-col gap-2 p-3 overflow-auto min-h-0">
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Clock size={14} />}
              label="Focus"
              value={fmtTime(totalFocusSeconds)}
              color="var(--color-primary)"
            />
            <IdleCard
              value={fmtTime(idleSeconds)}
              isIdling={isIdling}
              warn={idleSeconds > totalFocusSeconds && totalFocusSeconds > 0}
            />
            <StatCard
              icon={<Target size={14} />}
              label="Pomodoros"
              value={String(pomodorosCompleted)}
              color="var(--color-accent)"
            />
            <StatCard
              icon={<CheckSquare size={14} />}
              label="Tasks Done"
              value={String(tasksCompletedIds.length)}
              color="var(--color-success)"
            />
          </div>
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Clock size={24} style={{ opacity: 0.4 }} />
          <p className="text-xs">Start a session to track your focus time, idle time, and progress.</p>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-1 p-2.5 rounded-lg"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-base font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

interface IdleCardProps {
  value: string
  isIdling: boolean
  warn: boolean
}

function IdleCard({ value, isIdling, warn }: IdleCardProps) {
  const baseColor = warn ? 'var(--color-danger)' : 'var(--color-warning)'

  return (
    <div
      className="flex flex-col gap-1 p-2.5 rounded-lg"
      style={{
        background: isIdling
          ? `color-mix(in srgb, ${baseColor} 10%, var(--color-surface-2))`
          : 'var(--color-surface-2)',
        border: `1px solid ${isIdling
          ? `color-mix(in srgb, ${baseColor} 35%, transparent)`
          : 'var(--color-border)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Coffee size={14} style={{ color: baseColor }} />
        <span
          className="text-[10px] font-medium uppercase tracking-wide"
          style={{ color: baseColor }}
        >
          Idle
        </span>
        {/* Pulsing dot while actively counting */}
        {isIdling && (
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{
              background: baseColor,
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <span
        className="text-base font-bold tabular-nums"
        style={{ color: isIdling ? baseColor : 'var(--color-text-primary)' }}
      >
        {value}
      </span>

      {/* Instruction hint — only shown while idling */}
      {isIdling && (
        <span
          className="text-[9px] leading-tight mt-0.5"
          style={{ color: `color-mix(in srgb, ${baseColor} 70%, var(--color-text-muted))` }}
        >
          Start a timer to stop idling
        </span>
      )}
    </div>
  )
}
