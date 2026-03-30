import { create } from 'zustand'

interface TaskModalStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useTaskModalStore = create<TaskModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
