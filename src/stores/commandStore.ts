import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CommandStore {
  open: boolean
  recentCommandIds: string[]
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
  addRecentCommand: (id: string) => void
}

export const useCommandStore = create<CommandStore>()(
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
      name: 'studysesh-commands',
      partialize: (s) => ({ recentCommandIds: s.recentCommandIds }),
    }
  )
)
