import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SessionSummary } from '../types/session'
import { api } from '../lib/api'
import { useAuthStore } from './authStore'
import { useTaskStore } from './taskStore'
import { useSettingsStore } from './settingsStore'
import { useUIStore } from './uiStore'

interface SessionStore {
  startedAt: number | null
  totalFocusSeconds: number
  idleSeconds: number
  pomodorosCompleted: number
  tasksCompletedIds: string[]
  isActive: boolean
  summary: SessionSummary | null
  startSession: () => void
  endSession: () => void
  addFocusTime: (seconds: number) => void
  addIdleTime: (seconds: number) => void
  addCompletedTask: (taskId: string) => void
  incrementPomodoro: () => void
  dismissSummary: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      startedAt: null,
      totalFocusSeconds: 0,
      idleSeconds: 0,
      pomodorosCompleted: 0,
      tasksCompletedIds: [],
      isActive: false,
      summary: null,

      startSession: () =>
        set({
          startedAt: Date.now(),
          totalFocusSeconds: 0,
          idleSeconds: 0,
          pomodorosCompleted: 0,
          tasksCompletedIds: [],
          isActive: true,
          summary: null,
        }),

      endSession: () => {
        const s = get()
        const endedAt = Date.now()
        const startedAt = s.startedAt ?? endedAt
        const summary: SessionSummary = {
          startedAt,
          endedAt,
          totalFocusSeconds: s.totalFocusSeconds,
          idleSeconds: s.idleSeconds,
          pomodorosCompleted: s.pomodorosCompleted,
          tasksCompleted: s.tasksCompletedIds.length,
        }
        set({ isActive: false, startedAt: null, summary })

        const user = useAuthStore.getState().user
        const userName = user?.displayName ?? null
        if (userName) {
          const tasks = useTaskStore.getState().tasks
          const lastTaskId = s.tasksCompletedIds[s.tasksCompletedIds.length - 1]
          const lastTaskName = lastTaskId ? (tasks[lastTaskId]?.title ?? null) : null
          const { shareSessionData, shareLastTask } = useSettingsStore.getState()
          const { mode } = useUIStore.getState()

          const shouldShareSession =
            shareSessionData === 'both' ||
            (shareSessionData === 'only-study' && mode === 'study') ||
            (shareSessionData === 'only-personal' && mode === 'personal')

          if (!shouldShareSession) return

          const shouldShareLastTask =
            shareLastTask === 'both' ||
            (shareLastTask === 'only-study' && mode === 'study') ||
            (shareLastTask === 'only-personal' && mode === 'personal')

          api.postSession({
            userName,
            startedAt,
            endedAt,
            focusSecs: s.totalFocusSeconds,
            idleSecs: s.idleSeconds,
            pomodoros: s.pomodorosCompleted,
            tasksDone: s.tasksCompletedIds.length,
            lastTaskName,
            shareLastTask: shouldShareLastTask,
          }).catch(() => {
            // fire-and-forget; don't block UI on network errors
          })
        }
      },

      addFocusTime: (seconds) => set((s) => ({ totalFocusSeconds: s.totalFocusSeconds + seconds })),
      addIdleTime: (seconds) => set((s) => ({ idleSeconds: s.idleSeconds + seconds })),
      addCompletedTask: (taskId) => set((s) => ({ tasksCompletedIds: [...s.tasksCompletedIds, taskId] })),
      incrementPomodoro: () => set((s) => ({ pomodorosCompleted: s.pomodorosCompleted + 1 })),
      dismissSummary: () => set({ summary: null }),
    }),
    {
      name: 'studysesh-session',
      partialize: (s) => ({
        totalFocusSeconds: s.totalFocusSeconds,
        idleSeconds: s.idleSeconds,
        pomodorosCompleted: s.pomodorosCompleted,
        tasksCompletedIds: s.tasksCompletedIds,
      }),
    }
  )
)
