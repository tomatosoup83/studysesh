import { create } from 'zustand'
import { ColumnId } from '../types/task'

interface TaskModalOpts {
  defaultDueDate?: number
  defaultColumnId?: ColumnId
}

interface TaskModalStore {
  isOpen: boolean
  defaultDueDate: number | null
  defaultColumnId: ColumnId | null
  open: (opts?: TaskModalOpts) => void
  close: () => void
}

export const useTaskModalStore = create<TaskModalStore>((set) => ({
  isOpen: false,
  defaultDueDate: null,
  defaultColumnId: null,
  open: (opts?) => set({ isOpen: true, defaultDueDate: opts?.defaultDueDate ?? null, defaultColumnId: opts?.defaultColumnId ?? null }),
  close: () => set({ isOpen: false, defaultDueDate: null, defaultColumnId: null }),
}))
