import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { api } from '../lib/api'
import type { BudgetCategoryItem } from '../types/api'

interface BudgetCategoryStore {
  categories: BudgetCategoryItem[]
  isLoaded: boolean
  syncFromServer: () => Promise<void>
  addCategory: (name: string, color: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useBudgetCategoryStore = create<BudgetCategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoaded: false,

      syncFromServer: async () => {
        try {
          const { categories } = await api.budget.getCategories()
          set({ categories, isLoaded: true })
        } catch { /* offline */ }
      },

      addCategory: async (name, color) => {
        const id = nanoid()
        const newCat: BudgetCategoryItem = { id, name, color }
        set((s) => ({ categories: [...s.categories, newCat] }))
        try {
          await api.budget.createCategory(id, name, color)
        } catch {
          // rollback
          set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        }
      },

      deleteCategory: async (id) => {
        const prev = get().categories
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        try {
          await api.budget.deleteCategory(id)
        } catch {
          set({ categories: prev })
        }
      },
    }),
    { name: 'studysesh-budget-categories' }
  )
)
