import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../stores/authStore'
import { useBudgetSettingsStore } from '../../stores/budgetSettingsStore'
import { api } from '../../lib/api'
import type { BudgetLeaderboardEntry } from '../../types/api'
import { format, startOfWeek } from 'date-fns'

function getMondayStr(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

interface Props { open: boolean; onClose: () => void }

export function BudgetLeaderboard({ open, onClose }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMondayStr(new Date()))
  const [entries, setEntries] = useState<BudgetLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()
  const { leaderboardVisible } = useBudgetSettingsStore()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.budget.getLeaderboard(weekStart)
      .then((r) => { setEntries(r.entries); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, weekStart])

  const weekEnd = addDaysStr(weekStart, 6)
  const labelStart = format(new Date(weekStart + 'T00:00:00Z'), 'EEE d MMM')
  const labelEnd = format(new Date(weekEnd + 'T00:00:00Z'), 'EEE d MMM yyyy')

  return (
    <Modal open={open} onClose={onClose} title="Budget Leaderboard" size="lg">
      <div className="space-y-4">
        {/* Week selector */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{labelStart} – {labelEnd}</p>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(getMondayStr(new Date(e.target.value + 'T00:00:00Z')))}
            className="text-xs px-2 py-1 rounded-lg outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Privacy note */}
        {!leaderboardVisible && (
          <div
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            You are hidden from this leaderboard. Change in Settings → Budget.
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            No data yet. Users need to set a weekly limit and enable leaderboard visibility.
          </p>
        ) : (
          <div>
            {/* Header */}
            <div
              className="grid text-xs font-medium px-3 py-2 rounded-t-lg"
              style={{ gridTemplateColumns: '28px 1fr 80px 80px 80px 72px', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              <span>#</span>
              <span>Name</span>
              <span className="text-right">Spent</span>
              <span className="text-right">Limit</span>
              <span className="text-right">Surplus</span>
              <span className="text-right">% Under</span>
            </div>

            <div className="space-y-px">
              {entries.map((entry) => {
                const isMe = user?.displayName === entry.displayName
                return (
                  <div
                    key={`${entry.rank}-${entry.displayName}`}
                    className="grid items-center px-3 py-2.5 text-xs"
                    style={{
                      gridTemplateColumns: '28px 1fr 80px 80px 80px 72px',
                      background: isMe ? 'var(--color-primary)15' : 'var(--color-surface)',
                      borderLeft: isMe ? '3px solid var(--color-primary)' : '3px solid transparent',
                    }}
                  >
                    <span className="font-bold" style={{ color: entry.rank <= 3 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                      {entry.rank}
                    </span>
                    <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.displayName} {isMe && <span style={{ color: 'var(--color-primary)', fontSize: '0.6rem' }}>you</span>}
                    </span>
                    <span className="text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      ${entry.weeklySpent.toFixed(2)}
                    </span>
                    <span className="text-right" style={{ color: 'var(--color-text-muted)' }}>
                      ${entry.weeklyLimit.toFixed(2)}
                    </span>
                    <span className="text-right font-medium" style={{ color: entry.surplus >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {entry.surplus >= 0 ? '+' : ''}${entry.surplus.toFixed(2)}
                    </span>
                    <span className="text-right font-semibold" style={{ color: entry.pctUnderBudget >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {entry.pctUnderBudget.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
