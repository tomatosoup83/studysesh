import { create } from 'zustand'

interface BudgetTransactionModalStore {
  isOpen: boolean
  editingId: string | null
  defaultDate: string | null
  open: (opts?: { editingId?: string; defaultDate?: string }) => void
  close: () => void
}

export const useBudgetTransactionModalStore = create<BudgetTransactionModalStore>()((set) => ({
  isOpen: false,
  editingId: null,
  defaultDate: null,
  open: (opts) => set({ isOpen: true, editingId: opts?.editingId ?? null, defaultDate: opts?.defaultDate ?? null }),
  close: () => set({ isOpen: false, editingId: null, defaultDate: null }),
}))
