import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSessionStore } from '../stores/sessionStore'
import { getNextMode } from '../lib/pomodoroLogic'
import { playAlarm } from '../lib/alarm'

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Wall-clock timestamp when the current run started
  const runStartedAtRef = useRef<number | null>(null)
  // secondsRemaining value at the moment the current run started
  const runStartSecsRef = useRef<number>(0)
  // How many focus-seconds we've already credited to the session this run
  const creditedSecsRef = useRef<number>(0)
  // Guard so handleComplete fires at most once per timer completion
  const completedRef = useRef<boolean>(false)

  const handleComplete = useCallback(() => {
    const { mode, pomodorosCompletedInSession, completePomodoro, setMode, start } = useTimerStore.getState()
    const { timerDurations, notificationsEnabled, autoStartBreaks, longBreakInterval } = useSettingsStore.getState()

    if (mode === 'pomodoro') {
      completePomodoro()
      useSessionStore.getState().incrementPomodoro()
      playAlarm()
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
      setTimeout(() => useTimerStore.getState().start(), 50)
    }
  }, [])

  // Sync the timer against wall-clock time and return true if it completed
  const syncTick = useCallback(() => {
    if (runStartedAtRef.current === null) return

    const { status, mode } = useTimerStore.getState()
    if (status !== 'running') return

    const elapsed = Math.floor((Date.now() - runStartedAtRef.current) / 1000)
    const newSecs = Math.max(0, runStartSecsRef.current - elapsed)

    // Update secondsRemaining to the real wall-clock value
    useTimerStore.setState({ secondsRemaining: newSecs })

    // Credit focus time for seconds we haven't credited yet
    if (mode === 'pomodoro' && useSessionStore.getState().isActive) {
      const totalElapsed = runStartSecsRef.current - newSecs
      const toCredit = totalElapsed - creditedSecsRef.current
      if (toCredit > 0) {
        useSessionStore.getState().addFocusTime(toCredit)
        creditedSecsRef.current = totalElapsed
      }
    }

    // Timer hit zero
    if (newSecs <= 0 && !completedRef.current) {
      completedRef.current = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      handleComplete()
    }
  }, [handleComplete])

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prev) => {
      if (state.status === 'running' && prev.status !== 'running') {
        // Timer just started or resumed — record wall-clock start point
        runStartedAtRef.current = Date.now()
        runStartSecsRef.current = state.secondsRemaining
        creditedSecsRef.current = 0
        completedRef.current = false

        intervalRef.current = setInterval(syncTick, 500)
      } else if (state.status !== 'running' && prev.status === 'running') {
        if (intervalRef.current) clearInterval(intervalRef.current)
        runStartedAtRef.current = null
      }
    })

    // Catch up immediately when the tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncTick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      unsub()
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [syncTick])
}
