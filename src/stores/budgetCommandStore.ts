import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BudgetCommandStore {
  open: boolean
  recentCommandIds: string[]
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
  addRecentCommand: (id: string) => void
}

export const useBudgetCommandStore = create<BudgetCommandStore>()(
  persist(
    (set) => ({
      open: false,
      recentCommandIds: [],
      openPalette: () => set({ open: true }),
      closePalette: () => set({ open: false }),
      togglePalette: () => set((s) => ({ open: !s.open })),
      addRecentCommand: (id) =>
        set((s) => ({
          recentCommandIds: [id, ...s.recentCommandIds.filter((r) => r !== id)].slice(0, 5),
        })),
    }),
    {
      name: 'studysesh-budget-commands',
      partialize: (s) => ({ recentCommandIds: s.recentCommandIds }),
    }
  )
)
