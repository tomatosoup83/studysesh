import { create } from 'zustand'
import { api } from '../lib/api'
import type { BudgetTermItem, BudgetHolidayItem } from '../types/api'

interface BudgetSettingsStore {
  weeklyLimit: number
  leaderboardVisible: boolean
  terms: BudgetTermItem[]
  holidays: BudgetHolidayItem[]
  isLoaded: boolean
  syncFromServer: () => Promise<void>
  setWeeklyLimit: (limit: number) => Promise<void>
  setLeaderboardVisible: (visible: boolean) => Promise<void>
  saveTerms: (terms: Omit<BudgetTermItem, 'id'>[]) => Promise<void>
  addHoliday: (date: string, name: string) => Promise<void>
  deleteHoliday: (id: string) => Promise<void>
}

export const useBudgetSettingsStore = create<BudgetSettingsStore>()((set, get) => ({
  weeklyLimit: 0,
  leaderboardVisible: true,
  terms: [],
  holidays: [],
  isLoaded: false,

  syncFromServer: async () => {
    try {
      const [settings, termsData] = await Promise.all([
        api.budget.getSettings(),
        api.budget.getTerms(),
      ])
      set({
        weeklyLimit: settings.weeklyLimit,
        leaderboardVisible: settings.leaderboardVisible,
        terms: termsData.terms,
        holidays: termsData.holidays,
        isLoaded: true,
      })
    } catch { /* offline */ }
  },

  setWeeklyLimit: async (limit) => {
    set({ weeklyLimit: limit })
    try {
      await api.budget.updateSettings({ weeklyLimit: limit })
    } catch { /* ignore */ }
  },

  setLeaderboardVisible: async (visible) => {
    set({ leaderboardVisible: visible })
    try {
      await api.budget.updateSettings({ leaderboardVisible: visible })
    } catch { /* ignore */ }
  },

  saveTerms: async (terms) => {
    try {
      const result = await api.budget.saveTerms(terms)
      set({ terms: result.terms, holidays: result.holidays })
    } catch { /* ignore */ }
  },

  addHoliday: async (date, name) => {
    try {
      const holiday = await api.budget.createHoliday(date, name)
      set((s) => ({ holidays: [...s.holidays, holiday].sort((a, b) => a.date.localeCompare(b.date)) }))
    } catch { /* ignore */ }
  },

  deleteHoliday: async (id) => {
    const prev = get().holidays
    set((s) => ({ holidays: s.holidays.filter((h) => h.id !== id) }))
    try {
      await api.budget.deleteHoliday(id)
    } catch {
      set({ holidays: prev })
    }
  },
}))
