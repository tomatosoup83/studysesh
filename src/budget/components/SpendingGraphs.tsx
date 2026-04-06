import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, startOfWeek, addDays, subWeeks, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { Modal } from '../../components/ui/Modal'
import { useBudgetCategoryStore } from '../../stores/budgetCategoryStore'
import { useBudgetSettingsStore } from '../../stores/budgetSettingsStore'
import { computeAcademicWeeks } from '../lib/academicCalendar'
import { api } from '../../lib/api'
import type { BudgetTransactionItem } from '../../types/api'

type Period = 'weekly' | 'monthly' | 'termly'

function getMondayStr(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

interface Props { open: boolean; onClose: () => void }

export function SpendingGraphs({ open, onClose }: Props) {
  const [period, setPeriod] = useState<Period>('weekly')
  const [allTx, setAllTx] = useState<BudgetTransactionItem[]>([])
  const [loading, setLoading] = useState(false)
  const { categories } = useBudgetCategoryStore()
  const { terms, holidays, weeklyLimit } = useBudgetSettingsStore()

  // Load last 12 weeks of data on open
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const fetchWeeks = async () => {
      const txMap = new Map<string, BudgetTransactionItem>()
      const now = new Date()
      // Fetch 12 weeks
      await Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const weekStart = getMondayStr(subWeeks(now, i))
          return api.budget.getTransactions(weekStart).then(({ transactions }) => {
            for (const tx of transactions) txMap.set(tx.id, tx)
          }).catch(() => {})
        })
      )
      setAllTx(Array.from(txMap.values()))
      setLoading(false)
    }
    fetchWeeks()
  }, [open])

  const weeklyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const monday = startOfWeek(subWeeks(now, 11 - i), { weekStartsOn: 1 })
      const sunday = addDays(monday, 6)
      const mondayStr = format(monday, 'yyyy-MM-dd')
      const sundayStr = format(sunday, 'yyyy-MM-dd')
      const total = allTx.filter((tx) => tx.date >= mondayStr && tx.date <= sundayStr).reduce((s, t) => s + t.amount, 0)
      return { label: format(monday, 'dd MMM'), total: parseFloat(total.toFixed(2)) }
    })
  }, [allTx])

  const monthlyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const start = format(startOfMonth(d), 'yyyy-MM-dd')
      const end = format(endOfMonth(d), 'yyyy-MM-dd')
      const total = allTx.filter((tx) => tx.date >= start && tx.date <= end).reduce((s, t) => s + t.amount, 0)
      return { label: format(d, 'MMM yy'), total: parseFloat(total.toFixed(2)) }
    })
  }, [allTx])

  const termlyData = useMemo(() => {
    if (!terms.length) return []
    const weeks = computeAcademicWeeks(terms, holidays)
    const termGroups: Record<string, { label: string; total: number }> = {}
    for (const week of weeks) {
      const key = week.termName
      if (!termGroups[key]) termGroups[key] = { label: week.termName, total: 0 }
      const total = allTx.filter((tx) => tx.date >= week.mondayDate && tx.date <= week.sundayDate).reduce((s, t) => s + t.amount, 0)
      termGroups[key].total += total
    }
    return Object.values(termGroups).map((g) => ({ ...g, total: parseFloat(g.total.toFixed(2)) }))
  }, [allTx, terms, holidays])

  const data = period === 'weekly' ? weeklyData : period === 'monthly' ? monthlyData : termlyData

  // Category breakdown for selected period's data
  const catData = useMemo(() => {
    const byCategory: Record<string, number> = {}
    for (const tx of allTx) {
      const key = tx.categoryId ?? 'uncategorized'
      byCategory[key] = (byCategory[key] ?? 0) + tx.amount
    }
    return Object.entries(byCategory).map(([id, value]) => {
      const cat = categories.find((c) => c.id === id)
      return { name: cat?.name ?? 'Other', value: parseFloat(value.toFixed(2)), color: cat?.color ?? '#94a3b8' }
    })
  }, [allTx, categories])

  const tooltipStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--color-text-primary)',
  }

  return (
    <Modal open={open} onClose={onClose} title="Spending Graphs" size="xl">
      {/* Period toggle */}
      <div className="flex gap-2 mb-4">
        {(['weekly', 'monthly', 'termly'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
            style={{
              background: period === p ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: period === p ? 'white' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trend bar chart */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Spending trend</p>
            {data.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                {period === 'termly' ? 'Configure academic terms in Settings first.' : 'No data yet.'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`SGD ${Number(v).toFixed(2)}`, 'Spent']} />
                  {weeklyLimit > 0 && period === 'weekly' && (
                    <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                      {data.map((entry, i) => (
                        <Cell key={i} fill={entry.total > weeklyLimit ? 'var(--color-danger)' : 'var(--color-primary)'} />
                      ))}
                    </Bar>
                  )}
                  {!(weeklyLimit > 0 && period === 'weekly') && (
                    <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown pie */}
          {catData.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Category breakdown (all loaded data)</p>
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="value">
                      {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `SGD ${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 flex-1">
                  {catData.sort((a, b) => b.value - a.value).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
                      </div>
                      <span style={{ color: 'var(--color-text-primary)' }}>SGD {entry.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
