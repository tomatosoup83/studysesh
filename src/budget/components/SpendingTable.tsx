import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Pencil, Plus } from 'lucide-react'
import { format, parseISO, isAfter, startOfWeek } from 'date-fns'
import { useBudgetTransactionStore } from '../../stores/budgetTransactionStore'
import { useBudgetCategoryStore } from '../../stores/budgetCategoryStore'
import { useBudgetTransactionModalStore } from '../../stores/budgetTransactionModalStore'
import { computeAcademicWeeks, getAcademicWeekForDate } from '../lib/academicCalendar'
import { useBudgetSettingsStore } from '../../stores/budgetSettingsStore'

function formatSGD(n: number) {
  return `SGD ${n.toFixed(2)}`
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function getMondayNow(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function SpendingTable() {
  const { transactions, currentWeekStart, navigateWeek, updateTransaction, deleteTransaction, isLoading } = useBudgetTransactionStore()
  const { categories } = useBudgetCategoryStore()
  const { open: openModal } = useBudgetTransactionModalStore()
  const { terms, holidays } = useBudgetSettingsStore()

  const weekEnd = addDaysStr(currentWeekStart, 6)
  const isCurrentOrFutureWeek = !isAfter(new Date(getMondayNow() + 'T00:00:00Z'), new Date(currentWeekStart + 'T00:00:00Z'))

  // Inline edit state
  const [editCell, setEditCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showCatDropdown, setShowCatDropdown] = useState<string | null>(null)

  const academicLabel = useMemo(() => {
    if (!terms.length) return null
    const weeks = computeAcademicWeeks(terms, holidays)
    return getAcademicWeekForDate(weeks, currentWeekStart)?.label ?? null
  }, [terms, holidays, currentWeekStart])

  const total = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])

  const startEdit = (id: string, field: string, value: string) => {
    setEditCell({ id, field })
    setEditValue(value)
  }

  const commitEdit = async (id: string, field: string) => {
    setEditCell(null)
    if (field === 'name') {
      if (!editValue.trim()) return
      await updateTransaction(id, { name: editValue.trim() })
    } else if (field === 'amount') {
      const n = parseFloat(editValue)
      if (!isNaN(n) && n >= 0) await updateTransaction(id, { amount: n })
    } else if (field === 'notes') {
      await updateTransaction(id, { notes: editValue.trim() || null })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(id, field) }
    if (e.key === 'Escape') setEditCell(null)
  }

  const labelStart = format(parseISO(currentWeekStart), 'EEE d MMM')
  const labelEnd = format(parseISO(weekEnd), 'EEE d MMM yyyy')

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--color-panel-bg)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          onClick={() => navigateWeek('prev')}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {labelStart} – {labelEnd}
          </p>
          {academicLabel && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{academicLabel}</p>
          )}
        </div>

        <button
          onClick={() => navigateWeek('next')}
          disabled={isCurrentOrFutureWeek}
          className="p-1 rounded-lg transition-colors disabled:opacity-30"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => !isCurrentOrFutureWeek && (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
          </div>
        ) : (
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['#', 'Date', 'Name', 'Amount', 'Category', 'Notes', ''].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-xs font-medium"
                    style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', position: 'sticky', top: 0, zIndex: 1 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const cat = categories.find((c) => c.id === tx.categoryId)
                return (
                  <tr
                    key={tx.id}
                    className="group"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* # */}
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-text-muted)', width: 32 }}>{i + 1}</td>

                    {/* Date */}
                    <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {format(parseISO(tx.date), 'EEE d MMM')}
                    </td>

                    {/* Name — inline editable */}
                    <td className="px-3 py-2" style={{ minWidth: 120 }}>
                      {editCell?.id === tx.id && editCell.field === 'name' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(tx.id, 'name')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'name')}
                          className="w-full px-1 py-0.5 rounded text-sm outline-none"
                          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-primary)' }}
                        />
                      ) : (
                        <span
                          className="cursor-text block truncate text-xs"
                          style={{ color: 'var(--color-text-primary)', maxWidth: 160 }}
                          onClick={() => startEdit(tx.id, 'name', tx.name)}
                          title={tx.name}
                        >
                          {tx.name}
                        </span>
                      )}
                    </td>

                    {/* Amount — inline editable */}
                    <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                      {editCell?.id === tx.id && editCell.field === 'amount' ? (
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(tx.id, 'amount')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'amount')}
                          className="w-24 px-1 py-0.5 rounded text-sm outline-none"
                          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-primary)' }}
                        />
                      ) : (
                        <span
                          className="cursor-text"
                          onClick={() => startEdit(tx.id, 'amount', String(tx.amount))}
                        >
                          {formatSGD(tx.amount)}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2 relative" style={{ minWidth: 100 }}>
                      <button
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: cat?.color ?? 'var(--color-text-muted)' }}
                        onClick={() => setShowCatDropdown(showCatDropdown === tx.id ? null : tx.id)}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color ?? 'var(--color-border)' }} />
                        {cat?.name ?? 'None'}
                      </button>
                      {showCatDropdown === tx.id && (
                        <div
                          className="absolute left-0 top-8 z-20 rounded-lg shadow-lg overflow-hidden"
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', minWidth: 120 }}
                        >
                          <button
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:opacity-80"
                            style={{ color: 'var(--color-text-muted)' }}
                            onClick={() => { updateTransaction(tx.id, { categoryId: null }); setShowCatDropdown(null) }}
                          >
                            None
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs"
                              style={{ color: c.color }}
                              onClick={() => { updateTransaction(tx.id, { categoryId: c.id }); setShowCatDropdown(null) }}
                            >
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Notes — inline editable */}
                    <td className="px-3 py-2" style={{ maxWidth: 160 }}>
                      {editCell?.id === tx.id && editCell.field === 'notes' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(tx.id, 'notes')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'notes')}
                          className="w-full px-1 py-0.5 rounded text-sm outline-none"
                          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-primary)' }}
                        />
                      ) : (
                        <span
                          className="cursor-text block truncate text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                          onClick={() => startEdit(tx.id, 'notes', tx.notes ?? '')}
                          title={tx.notes ?? ''}
                        >
                          {tx.notes || <span style={{ opacity: 0.4 }}>—</span>}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal({ editingId: tx.id })}
                          className="p-0.5 rounded"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-0.5 rounded"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {/* Total row */}
              {transactions.length > 0 && (
                <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                  <td colSpan={3} className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total</td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatSGD(total)}</td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Empty state */}
        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No transactions this week</p>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              <Plus size={12} />
              Add first transaction
            </button>
          </div>
        )}
      </div>

      {/* Footer add button */}
      {transactions.length > 0 && (
        <div
          className="px-4 py-2 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={12} />
            Add transaction <span style={{ color: 'var(--color-text-muted)' }}>⌘A</span>
          </button>
        </div>
      )}
    </div>
  )
}
