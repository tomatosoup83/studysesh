import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { format, startOfWeek, addDays } from 'date-fns'
import { api } from '../lib/api'
import type { BudgetTransactionItem } from '../types/api'

function getMondayStr(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

interface BudgetTransactionStore {
  transactions: BudgetTransactionItem[]
  currentWeekStart: string
  isLoading: boolean
  fetchWeek: (weekStart: string) => Promise<void>
  navigateWeek: (direction: 'prev' | 'next') => void
  addTransaction: (tx: Omit<BudgetTransactionItem, 'id' | 'createdAt'>) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Omit<BudgetTransactionItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useBudgetTransactionStore = create<BudgetTransactionStore>()((set, get) => ({
  transactions: [],
  currentWeekStart: getMondayStr(),
  isLoading: false,

  fetchWeek: async (weekStart) => {
    set({ isLoading: true, currentWeekStart: weekStart })
    try {
      const { transactions } = await api.budget.getTransactions(weekStart)
      set({ transactions, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  navigateWeek: (direction) => {
    const { currentWeekStart, fetchWeek } = get()
    const current = new Date(currentWeekStart + 'T00:00:00Z')
    const next = addDays(current, direction === 'next' ? 7 : -7)
    const nextStr = format(next, 'yyyy-MM-dd')
    fetchWeek(nextStr)
  },

  addTransaction: async (tx) => {
    const id = nanoid()
    const newTx: BudgetTransactionItem = { ...tx, id, createdAt: Date.now() }
    set((s) => ({ transactions: [...s.transactions, newTx].sort((a, b) => a.date.localeCompare(b.date)) }))
    try {
      const created = await api.budget.createTransaction({ ...tx, id })
      set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? created : t) }))
    } catch {
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    }
  },

  updateTransaction: async (id, updates) => {
    const prev = get().transactions
    set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t) }))
    try {
      await api.budget.updateTransaction(id, updates)
    } catch {
      set({ transactions: prev })
    }
  },

  deleteTransaction: async (id) => {
    const prev = get().transactions
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    try {
      await api.budget.deleteTransaction(id)
    } catch {
      set({ transactions: prev })
    }
  },
}))
