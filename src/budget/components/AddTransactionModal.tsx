import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Modal } from '../../components/ui/Modal'
import { useBudgetTransactionModalStore } from '../../stores/budgetTransactionModalStore'
import { useBudgetTransactionStore } from '../../stores/budgetTransactionStore'
import { useBudgetCategoryStore } from '../../stores/budgetCategoryStore'

export function AddTransactionModal() {
  const { isOpen, editingId, defaultDate, close } = useBudgetTransactionModalStore()
  const { transactions, addTransaction, updateTransaction } = useBudgetTransactionStore()
  const { categories } = useBudgetCategoryStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill when editing
  useEffect(() => {
    if (!isOpen) return
    if (editingId) {
      const tx = transactions.find((t) => t.id === editingId)
      if (tx) {
        setName(tx.name)
        setAmount(String(tx.amount))
        setDate(tx.date)
        setCategoryId(tx.categoryId)
        setNotes(tx.notes ?? '')
      }
    } else {
      setName('')
      setAmount('')
      setDate(defaultDate ?? today)
      setCategoryId(null)
      setNotes('')
    }
    setError('')
  }, [isOpen, editingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 0) { setError('Valid amount required'); return }

    setSaving(true)
    try {
      if (editingId) {
        await updateTransaction(editingId, { name: name.trim(), amount: parsedAmount, date, categoryId, notes: notes.trim() || null })
      } else {
        await addTransaction({ date, name: name.trim(), amount: parsedAmount, categoryId, notes: notes.trim() || null })
      }
      close()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={close} title={editingId ? 'Edit Transaction' : 'Add Transaction'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <input
            type="text"
            autoFocus
            placeholder="Transaction name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Amount + Date row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Amount (SGD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: categoryId === null ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: categoryId === null ? 'white' : 'var(--color-text-secondary)',
                border: `1px solid ${categoryId === null ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              None
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: categoryId === cat.id ? cat.color + '33' : 'var(--color-surface-2)',
                  color: categoryId === cat.id ? cat.color : 'var(--color-text-secondary)',
                  border: `1px solid ${categoryId === cat.id ? cat.color : 'var(--color-border)'}`,
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Any notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
