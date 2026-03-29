import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TimerMode, TimerStatus } from '../types/timer'

interface TimerStore {
  mode: TimerMode
  status: TimerStatus
  secondsRemaining: number
  pomodorosCompletedInSession: number
  activeTaskId: string | null
  tick: () => void
  start: () => void
  pause: () => void
  reset: (durations: { pomodoro: number; shortBreak: number; longBreak: number }) => void
  setMode: (mode: TimerMode, durations: { pomodoro: number; shortBreak: number; longBreak: number }) => void
  setActiveTask: (taskId: string | null) => void
  completePomodoro: () => void
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      mode: 'pomodoro',
      status: 'idle',
      secondsRemaining: 25 * 60,
      pomodorosCompletedInSession: 0,
      activeTaskId: null,
      tick: () => set((s) => ({ secondsRemaining: Math.max(0, s.secondsRemaining - 1) })),
      start: () => set({ status: 'running' }),
      pause: () => set({ status: 'paused' }),
      reset: (durations) => {
        const { mode } = get()
        const map: Record<TimerMode, number> = {
          pomodoro: durations.pomodoro,
          'short-break': durations.shortBreak,
          'long-break': durations.longBreak,
        }
        set({ status: 'idle', secondsRemaining: map[mode] })
      },
      setMode: (mode, durations) => {
        const map: Record<TimerMode, number> = {
          pomodoro: durations.pomodoro,
          'short-break': durations.shortBreak,
          'long-break': durations.longBreak,
        }
        set({ mode, status: 'idle', secondsRemaining: map[mode] })
      },
      setActiveTask: (taskId) => set({ activeTaskId: taskId }),
      completePomodoro: () =>
        set((s) => ({ pomodorosCompletedInSession: s.pomodorosCompletedInSession + 1 })),
    }),
    {
      name: 'studysesh-timer',
      partialize: (s) => ({
        mode: s.mode,
        secondsRemaining: s.secondsRemaining,
        pomodorosCompletedInSession: s.pomodorosCompletedInSession,
        activeTaskId: s.activeTaskId,
      }),
    }
  )
)
