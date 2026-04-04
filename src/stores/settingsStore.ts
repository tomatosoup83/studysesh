import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'paper' | 'ocean' | 'forest' | 'sunset' | 'custom'

export const CSS_VAR_KEYS = [
  '--color-bg',
  '--color-panel-bg',
  '--color-surface',
  '--color-surface-2',
  '--color-surface-3',
  '--color-border',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-primary',
  '--color-secondary',
  '--color-accent',
  '--color-success',
  '--color-warning',
  '--color-danger',
] as const

export type CssVarKey = typeof CSS_VAR_KEYS[number]

// Per-theme hardcoded values used to seed the custom theme editor
export const THEME_PRESETS: Record<Exclude<Theme, 'custom'>, Record<CssVarKey, string>> = {
  dark: {
    '--color-bg': '#0f172a', '--color-panel-bg': '#1e293b',
    '--color-surface': '#1e293b', '--color-surface-2': '#0f172a', '--color-surface-3': '#273549',
    '--color-border': '#334155',
    '--color-text-primary': '#f1f5f9', '--color-text-secondary': '#cbd5e1', '--color-text-muted': '#94a3b8',
    '--color-primary': '#818cf8', '--color-secondary': '#a78bfa', '--color-accent': '#22d3ee',
    '--color-success': '#34d399', '--color-warning': '#fbbf24', '--color-danger': '#f87171',
  },
  light: {
    '--color-bg': '#f8fafc', '--color-panel-bg': '#ffffff',
    '--color-surface': '#ffffff', '--color-surface-2': '#f8fafc', '--color-surface-3': '#f1f5f9',
    '--color-border': '#e2e8f0',
    '--color-text-primary': '#0f172a', '--color-text-secondary': '#475569', '--color-text-muted': '#94a3b8',
    '--color-primary': '#6366f1', '--color-secondary': '#8b5cf6', '--color-accent': '#06b6d4',
    '--color-success': '#10b981', '--color-warning': '#f59e0b', '--color-danger': '#ef4444',
  },
  paper: {
    '--color-bg': '#fffbeb', '--color-panel-bg': '#fefce8',
    '--color-surface': '#fefce8', '--color-surface-2': '#fef9c3', '--color-surface-3': '#fef08a',
    '--color-border': '#d97706',
    '--color-text-primary': '#1c1917', '--color-text-secondary': '#57534e', '--color-text-muted': '#a8a29e',
    '--color-primary': '#92400e', '--color-secondary': '#b45309', '--color-accent': '#065f46',
    '--color-success': '#065f46', '--color-warning': '#92400e', '--color-danger': '#991b1b',
  },
  ocean: {
    '--color-bg': '#071220', '--color-panel-bg': '#0c1a2e',
    '--color-surface': '#0c1a2e', '--color-surface-2': '#071220', '--color-surface-3': '#112240',
    '--color-border': '#1e3a5f',
    '--color-text-primary': '#e2f4ff', '--color-text-secondary': '#93c5d0', '--color-text-muted': '#4a7fa5',
    '--color-primary': '#38bdf8', '--color-secondary': '#67e8f9', '--color-accent': '#34d399',
    '--color-success': '#34d399', '--color-warning': '#fbbf24', '--color-danger': '#f87171',
  },
  forest: {
    '--color-bg': '#081208', '--color-panel-bg': '#0f1f0f',
    '--color-surface': '#0f1f0f', '--color-surface-2': '#081208', '--color-surface-3': '#162916',
    '--color-border': '#1e4020',
    '--color-text-primary': '#dcfce7', '--color-text-secondary': '#86efac', '--color-text-muted': '#4a7a50',
    '--color-primary': '#4ade80', '--color-secondary': '#86efac', '--color-accent': '#fcd34d',
    '--color-success': '#4ade80', '--color-warning': '#fcd34d', '--color-danger': '#f87171',
  },
  sunset: {
    '--color-bg': '#140a02', '--color-panel-bg': '#1f0f05',
    '--color-surface': '#1f0f05', '--color-surface-2': '#140a02', '--color-surface-3': '#2e1508',
    '--color-border': '#5c2e0e',
    '--color-text-primary': '#fff1e6', '--color-text-secondary': '#fdba74', '--color-text-muted': '#9a4a18',
    '--color-primary': '#fb923c', '--color-secondary': '#f472b6', '--color-accent': '#fbbf24',
    '--color-success': '#4ade80', '--color-warning': '#fbbf24', '--color-danger': '#f87171',
  },
}

interface SettingsStore {
  theme: Theme
  customThemeVars: Record<CssVarKey, string>
  timerDurations: { pomodoro: number; shortBreak: number; longBreak: number }
  notificationsEnabled: boolean
  autoStartBreaks: boolean
  longBreakInterval: number
  shareLastTask: boolean
  showTimerInTitle: boolean
  musicPlayerMode: 'inline' | 'popup'
  alarmSoundBase64: string | null
  alarmSoundName: string | null
  alarmDurationSecs: number
  setTheme: (theme: Theme) => void
  setCustomThemeVar: (key: CssVarKey, value: string) => void
  resetCustomTheme: (base: Exclude<Theme, 'custom'>) => void
  setTimerDuration: (mode: 'pomodoro' | 'shortBreak' | 'longBreak', seconds: number) => void
  setNotificationsEnabled: (v: boolean) => void
  setAutoStartBreaks: (v: boolean) => void
  setLongBreakInterval: (v: number) => void
  setShareLastTask: (v: boolean) => void
  setShowTimerInTitle: (v: boolean) => void
  setMusicPlayerMode: (v: 'inline' | 'popup') => void
  setAlarmSound: (base64: string | null, name: string | null) => void
  setAlarmDuration: (secs: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      customThemeVars: { ...THEME_PRESETS.dark },
      timerDurations: { pomodoro: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
      notificationsEnabled: true,
      autoStartBreaks: false,
      longBreakInterval: 4,
      shareLastTask: true,
      showTimerInTitle: true,
      musicPlayerMode: 'inline',
      alarmSoundBase64: null,
      alarmSoundName: null,
      alarmDurationSecs: 5,
      setTheme: (theme) => set({ theme }),
      setCustomThemeVar: (key, value) =>
        set((s) => ({ customThemeVars: { ...s.customThemeVars, [key]: value } })),
      resetCustomTheme: (base) =>
        set({ customThemeVars: { ...THEME_PRESETS[base] } }),
      setTimerDuration: (mode, seconds) =>
        set((s) => ({ timerDurations: { ...s.timerDurations, [mode]: seconds } })),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setAutoStartBreaks: (v) => set({ autoStartBreaks: v }),
      setLongBreakInterval: (v) => set({ longBreakInterval: v }),
      setShareLastTask: (v) => set({ shareLastTask: v }),
      setShowTimerInTitle: (v) => set({ showTimerInTitle: v }),
      setMusicPlayerMode: (v) => set({ musicPlayerMode: v }),
      setAlarmSound: (base64, name) => set({ alarmSoundBase64: base64, alarmSoundName: name }),
      setAlarmDuration: (secs) => set({ alarmDurationSecs: secs }),
    }),
    { name: 'studysesh-settings' }
  )
)
