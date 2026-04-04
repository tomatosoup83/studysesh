import { useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { useTimerStore } from '../stores/timerStore'

export function useIdleTimer() {
  useEffect(() => {
    let idleStartMs: number | null = null

    const tick = () => {
      const { isActive, addIdleTime } = useSessionStore.getState()
      const { status } = useTimerStore.getState()
      const now = Date.now()

      if (isActive && status !== 'running') {
        if (idleStartMs === null) idleStartMs = now
        const delta = Math.floor((now - idleStartMs) / 1000)
        if (delta > 0) {
          addIdleTime(delta)
          idleStartMs = now
        }
      } else {
        idleStartMs = null
      }
    }

    const interval = setInterval(tick, 1000)
    const onVisibility = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
