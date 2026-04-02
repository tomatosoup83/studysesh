import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'paper' | 'ocean' | 'forest' | 'sunset'

interface SettingsStore {
  theme: Theme
  timerDurations: { pomodoro: number; shortBreak: number; longBreak: number }
  notificationsEnabled: boolean
  autoStartBreaks: boolean
  longBreakInterval: number
  shareLastTask: boolean
  setTheme: (theme: Theme) => void
  setTimerDuration: (mode: 'pomodoro' | 'shortBreak' | 'longBreak', seconds: number) => void
  setNotificationsEnabled: (v: boolean) => void
  setAutoStartBreaks: (v: boolean) => void
  setLongBreakInterval: (v: number) => void
  setShareLastTask: (v: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      timerDurations: { pomodoro: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
      notificationsEnabled: true,
      autoStartBreaks: false,
      longBreakInterval: 4,
      shareLastTask: true,
      setTheme: (theme) => set({ theme }),
      setTimerDuration: (mode, seconds) =>
        set((s) => ({ timerDurations: { ...s.timerDurations, [mode]: seconds } })),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setAutoStartBreaks: (v) => set({ autoStartBreaks: v }),
      setLongBreakInterval: (v) => set({ longBreakInterval: v }),
      setShareLastTask: (v) => set({ shareLastTask: v }),
    }),
    { name: 'studysesh-settings' }
  )
)
