import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useBudgetTransactionStore } from '../../stores/budgetTransactionStore'
import { useBudgetCategoryStore } from '../../stores/budgetCategoryStore'
import { useBudgetSettingsStore } from '../../stores/budgetSettingsStore'
import { computeAcademicWeeks, getCurrentAcademicWeek } from '../lib/academicCalendar'
import { format, parseISO } from 'date-fns'

function formatSGD(amount: number) {
  return `SGD ${amount.toFixed(2)}`
}

export function WeeklyOverviewPanel({ weekLabel }: { weekLabel: string }) {
  const { transactions } = useBudgetTransactionStore()
  const { categories } = useBudgetCategoryStore()
  const { weeklyLimit, terms, holidays } = useBudgetSettingsStore()

  const totalSpent = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])
  const remaining = weeklyLimit - totalSpent
  const pct = weeklyLimit > 0 ? Math.min((totalSpent / weeklyLimit) * 100, 100) : 0

  const barColor = pct < 80 ? 'var(--color-success)' : pct < 100 ? 'var(--color-warning)' : 'var(--color-danger)'

  // Pie data by category
  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {}
    for (const tx of transactions) {
      const key = tx.categoryId ?? 'uncategorized'
      byCategory[key] = (byCategory[key] ?? 0) + tx.amount
    }
    return Object.entries(byCategory).map(([id, value]) => {
      const cat = categories.find((c) => c.id === id)
      return { name: cat?.name ?? 'Other', value, color: cat?.color ?? '#94a3b8' }
    })
  }, [transactions, categories])

  // Quick stats
  const biggestTx = useMemo(() =>
    transactions.length ? transactions.reduce((a, b) => a.amount > b.amount ? a : b) : null
  , [transactions])

  const topCategory = useMemo(() => {
    if (!pieData.length) return null
    return pieData.reduce((a, b) => a.value > b.value ? a : b)
  }, [pieData])

  // Academic week label
  const academicLabel = useMemo(() => {
    if (!terms.length) return weekLabel
    const weeks = computeAcademicWeeks(terms, holidays)
    const current = getCurrentAcademicWeek(weeks)
    return current ? current.label : weekLabel
  }, [terms, holidays, weekLabel])

  return (
    <div
      className="h-full flex flex-col gap-4 p-4 overflow-y-auto"
      style={{ background: 'var(--color-panel-bg)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}
    >
      {/* Week label */}
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{academicLabel}</p>
      </div>

      {/* Spending progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--color-text-primary)' }} className="font-semibold">{formatSGD(totalSpent)}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {weeklyLimit > 0 ? `/ ${formatSGD(weeklyLimit)}` : 'No limit set'}
          </span>
        </div>
        {weeklyLimit > 0 && (
          <>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 8, background: 'var(--color-surface-3)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <p className="text-xs" style={{ color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {remaining >= 0
                ? `${formatSGD(remaining)} remaining`
                : `${formatSGD(Math.abs(remaining))} over budget`}
            </p>
          </>
        )}
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>By category</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatSGD(Number(value))}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--color-text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="space-y-1 mt-1">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
                </div>
                <span style={{ color: 'var(--color-text-primary)' }}>{formatSGD(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div
        className="space-y-2 pt-2"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>This week</p>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--color-text-muted)' }}>Transactions</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{transactions.length}</span>
        </div>
        {biggestTx && (
          <div className="flex justify-between text-xs gap-2">
            <span style={{ color: 'var(--color-text-muted)' }} className="truncate">Biggest</span>
            <span style={{ color: 'var(--color-text-primary)' }} className="truncate text-right flex-1 max-w-[60%]">
              {biggestTx.name} ({formatSGD(biggestTx.amount)})
            </span>
          </div>
        )}
        {topCategory && (
          <div className="flex justify-between text-xs gap-2">
            <span style={{ color: 'var(--color-text-muted)' }}>Top category</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{topCategory.name}</span>
          </div>
        )}
        {weeklyLimit > 0 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--color-text-muted)' }}>% under budget</span>
            <span style={{ color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {weeklyLimit > 0 ? `${((remaining / weeklyLimit) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
