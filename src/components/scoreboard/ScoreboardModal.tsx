import { useState } from 'react'
import { Download, ChevronDown, ChevronRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useScoreboardStore } from '../../stores/scoreboardStore'
import { api } from '../../lib/api'
import type { LeaderboardPeriod, UserSession } from '../../types/api'
import { formatDuration, intervalToDuration } from 'date-fns'

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function fmtMins(mins: number) {
  const dur = intervalToDuration({ start: 0, end: mins * 60 * 1000 })
  return formatDuration(dur, { format: ['hours', 'minutes'] }) || '0 min'
}

function UserHistory({ userName }: { userName: string }) {
  const [sessions, setSessions] = useState<UserSession[] | null>(null)
  const [loading, setLoading] = useState(false)

  if (sessions === null && !loading) {
    setLoading(true)
    api.getUserSessions(userName, 10).then((res) => {
      setSessions(res.sessions)
      setLoading(false)
    }).catch(() => {
      setSessions([])
      setLoading(false)
    })
  }

  if (loading) {
    return <div className="text-xs py-2 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
  }

  if (!sessions || sessions.length === 0) {
    return <div className="text-xs py-2 text-center" style={{ color: 'var(--color-text-muted)' }}>No sessions yet.</div>
  }

  return (
    <div className="mt-1 space-y-1">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
        >
          <span>{s.date}</span>
          <span>{fmtMins(Math.round(s.focusSecs / 60))}</span>
          <span>{s.pomodoros} 🍅</span>
          <span>{s.tasksDone} tasks</span>
          {s.notes && <span className="truncate max-w-[8rem]">{s.notes}</span>}
        </div>
      ))}
    </div>
  )
}

export function ScoreboardModal() {
  const { isOpen, period, data, isLoading, error, closeScoreboard, setPeriod } = useScoreboardStore()
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const toggleUser = (userName: string) => {
    setExpandedUser(expandedUser === userName ? null : userName)
  }

  return (
    <Modal open={isOpen} onClose={closeScoreboard} title="Scoreboard" size="xl">
      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: period === p.value ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: period === p.value ? 'white' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range label */}
      {data && (
        <div className="text-xs mb-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
          {data.rangeStart === data.rangeEnd ? data.rangeStart : `${data.rangeStart} – ${data.rangeEnd}`}
        </div>
      )}

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--color-surface-2)' }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-error, #ef4444)' }}>
          {error}
        </p>
      )}

      {!isLoading && !error && data && data.entries.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          No sessions for this period yet.
        </p>
      )}

      {!isLoading && !error && data && data.entries.length > 0 && (
        <div className="space-y-1">
          {/* Header */}
          <div
            className="grid text-[10px] font-medium px-3 py-1"
            style={{ color: 'var(--color-text-muted)', gridTemplateColumns: '2rem 1fr 8rem 5rem 4rem 3rem 4rem 4rem 4rem' }}
          >
            <span>#</span>
            <span>Name</span>
            <span>Last Task</span>
            <span>Focus</span>
            <span>Idle</span>
            <span>🍅</span>
            <span>Tasks</span>
            <span>Sessions</span>
            <span>Streak</span>
          </div>

          {data.entries.map((entry) => (
            <div key={entry.userName}>
              <button
                onClick={() => toggleUser(entry.userName)}
                className="w-full text-left"
              >
                <div
                  className="grid items-center px-3 py-2 rounded-xl text-xs transition-colors"
                  style={{
                    background: expandedUser === entry.userName ? 'var(--color-surface-2)' : 'transparent',
                    border: '1px solid transparent',
                    gridTemplateColumns: '2rem 1fr 8rem 5rem 4rem 3rem 4rem 4rem 4rem',
                    color: 'var(--color-text-primary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = expandedUser === entry.userName ? 'var(--color-surface-2)' : 'transparent')}
                >
                  <span className="font-bold" style={{ color: entry.rank <= 3 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {entry.rank}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    {expandedUser === entry.userName ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {entry.userName}
                  </span>
                  <span className="truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {entry.shareLastTask && entry.lastTaskName
                      ? entry.lastTaskName
                      : entry.lastTaskName !== undefined
                        ? <em style={{ fontSize: '0.65rem' }}>hidden by user</em>
                        : '—'}
                  </span>
                  <span>{fmtMins(entry.totalFocusMins)}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{fmtMins(entry.totalIdleMins)}</span>
                  <span>{entry.totalPomodoros}</span>
                  <span>{entry.totalTasksDone}</span>
                  <span>{entry.sessionCount}</span>
                  <span>{entry.streak > 0 ? `${entry.streak}🔥` : '—'}</span>
                </div>
              </button>
              {expandedUser === entry.userName && (
                <div className="px-3 pb-2">
                  <UserHistory userName={entry.userName} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CSV download */}
      {data && (
        <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--color-border)' }}>
          <a
            href={api.getCsvUrl(data.rangeStart)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <Download size={12} />
            Download CSV
          </a>
        </div>
      )}
    </Modal>
  )
}
