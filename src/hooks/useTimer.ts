import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getNextMode } from '../lib/pomodoroLogic'

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleComplete = useCallback(() => {
    const { mode, pomodorosCompletedInSession, completePomodoro, setMode, start } = useTimerStore.getState()
    const { timerDurations, notificationsEnabled, autoStartBreaks, longBreakInterval } = useSettingsStore.getState()

    if (mode === 'pomodoro') {
      completePomodoro()
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro complete! 🍅', { body: 'Time for a break.' })
      }
    } else {
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Break over!', { body: 'Time to focus.' })
      }
    }

    const nextMode = getNextMode(mode, pomodorosCompletedInSession, longBreakInterval)
    setMode(nextMode, timerDurations)
    if (autoStartBreaks) {
      // slight delay so state settles
      setTimeout(() => useTimerStore.getState().start(), 50)
    }
  }, [])

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prev) => {
      if (state.status === 'running' && prev.status !== 'running') {
        intervalRef.current = setInterval(() => {
          const { secondsRemaining, tick, status } = useTimerStore.getState()
          if (status !== 'running') {
            clearInterval(intervalRef.current!)
            return
          }
          if (secondsRemaining <= 1) {
            clearInterval(intervalRef.current!)
            tick()
            handleComplete()
          } else {
            tick()
          }
        }, 1000)
      } else if (state.status !== 'running' && prev.status === 'running') {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    })

    return () => {
      unsub()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [handleComplete])
}
