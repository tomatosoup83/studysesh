import { create } from 'zustand'
import { api } from '../lib/api'
import type { LeaderboardPeriod, LeaderboardResponse } from '../types/api'

interface ScoreboardStore {
  isOpen: boolean
  period: LeaderboardPeriod
  data: LeaderboardResponse | null
  isLoading: boolean
  error: string | null
  openScoreboard: () => void
  closeScoreboard: () => void
  setPeriod: (period: LeaderboardPeriod) => void
  fetchLeaderboard: () => Promise<void>
}

export const useScoreboardStore = create<ScoreboardStore>((set, get) => ({
  isOpen: false,
  period: 'daily',
  data: null,
  isLoading: false,
  error: null,

  openScoreboard: () => {
    set({ isOpen: true })
    get().fetchLeaderboard()
  },

  closeScoreboard: () => set({ isOpen: false }),

  setPeriod: (period) => {
    set({ period })
    get().fetchLeaderboard()
  },

  fetchLeaderboard: async () => {
    const { period } = get()
    set({ isLoading: true, error: null })
    try {
      const data = await api.getLeaderboard(period)
      set({ data, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },
}))
