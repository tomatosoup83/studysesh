import { create } from 'zustand'

interface TaskModalStore {
  isOpen: boolean
  defaultDueDate: number | null
  open: (defaultDueDate?: number) => void
  close: () => void
}

export const useTaskModalStore = create<TaskModalStore>((set) => ({
  isOpen: false,
  defaultDueDate: null,
  open: (defaultDueDate?) => set({ isOpen: true, defaultDueDate: defaultDueDate ?? null }),
  close: () => set({ isOpen: false, defaultDueDate: null }),
}))
