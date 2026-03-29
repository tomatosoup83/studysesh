import { useEffect, useRef } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { useTimerStore } from '../stores/timerStore'

export function useIdleTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const { isActive, addIdleTime } = useSessionStore.getState()
      const { status } = useTimerStore.getState()
      if (isActive && status !== 'running') {
        addIdleTime(1)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
