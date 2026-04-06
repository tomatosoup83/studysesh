import { useEffect, useState } from 'react'
import { useSettingsStore, CSS_VAR_KEYS } from './stores/settingsStore'
import { BudgetApp } from './budget/BudgetApp'
import { useAuthStore } from './stores/authStore'
import { useTaskStore } from './stores/taskStore'
import { useTimerStore } from './stores/timerStore'
import { useSessionStore } from './stores/sessionStore'
import { Header } from './components/header/Header'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { MobileLayout } from './components/layout/MobileLayout'
import { ResizeHandle } from './components/ui/ResizeHandle'
import { CommandPalette } from './components/command/CommandPalette'
import { SessionSummaryModal } from './components/session/SessionSummaryModal'
import { ScoreboardModal } from './components/scoreboard/ScoreboardModal'
import { AddTaskModal } from './components/board/AddTaskModal'
import { ToastContainer } from './components/ui/Toast'
import { WelcomeModal } from './components/welcome/WelcomeModal'
import { useResize } from './hooks/useResize'
import { useTimer } from './hooks/useTimer'
import { useIdleTimer } from './hooks/useIdleTimer'
import { useNotifications } from './hooks/useNotifications'
import { useIsMobile } from './hooks/useIsMobile'
import { useUIStore } from './stores/uiStore'
import './styles/themes.css'
import './styles/globals.css'

export default function App() {
  if (window.location.pathname.startsWith('/budget')) return <BudgetApp />
  return <StudySeshApp />
}

function StudySeshApp() {
  const { theme, customThemeVars, studyModeTheme, personalModeTheme, setTheme, setCustomThemeVarsAll } = useSettingsStore()
  const { user, hydrateFromToken } = useAuthStore()
  const { syncFromServer } = useTaskStore()
  const { isHyperFocus, mode: appMode, welcomeTrigger } = useUIStore()
  const [showWelcome, setShowWelcome] = useState(() => useSettingsStore.getState().showWelcomeOnStart)
  const { secondsRemaining, status, mode } = useTimerStore()
  const { isActive } = useSessionStore()
  const { showTimerInTitle } = useSettingsStore()
  const isMobile = useIsMobile()

  // Track current idle streak duration for title display
  const [currentIdleSecs, setCurrentIdleSecs] = useState(0)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isActive && status !== 'running') {
      const start = Date.now()
      interval = setInterval(() => setCurrentIdleSecs(Math.floor((Date.now() - start) / 1000)), 1000)
    } else {
      setCurrentIdleSecs(0)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isActive, status])

  const { size: rightWidth, onPointerDown } = useResize({
    direction: 'horizontal',
    initial: 300,
    min: 220,
    max: 520,
    storageKey: 'studysesh-right-width',
  })

  useTimer()
  useIdleTimer()
  useNotifications()

  // Apply theme (extracted to useThemeApplicator but kept inline here for studysesh)
  useEffect(() => {
    const root = document.documentElement
    CSS_VAR_KEYS.forEach((k) => root.style.removeProperty(k))
    if (theme === 'custom') {
      root.removeAttribute('data-theme')
      Object.entries(customThemeVars).forEach(([k, v]) => root.style.setProperty(k, v))
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme, customThemeVars])

  // Update browser tab title with timer/idle state
  useEffect(() => {
    if (!showTimerInTitle) { document.title = 'StudySesh'; return }
    if (status === 'running' || status === 'paused') {
      const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0')
      const secs = String(secondsRemaining % 60).padStart(2, '0')
      const label = mode === 'pomodoro' ? 'Focus' : mode === 'short-break' ? 'Short Break' : 'Long Break'
      document.title = `${mins}:${secs} — ${label}`
    } else if (isActive) {
      const s = currentIdleSecs
      const display = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
      document.title = `${display} — Idling`
    } else {
      document.title = 'StudySesh'
    }
  }, [secondsRemaining, status, mode, isActive, currentIdleSecs, showTimerInTitle])

  // Validate stored token and sync tasks on mount
  useEffect(() => {
    hydrateFromToken().then((ok) => {
      if (ok) syncFromServer()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tasks when user logs in
  useEffect(() => {
    if (user) syncFromServer()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply per-mode default theme when mode changes
  useEffect(() => {
    const modeTheme = appMode === 'study' ? studyModeTheme : personalModeTheme
    if (modeTheme) {
      setTheme(modeTheme.theme)
      if (modeTheme.theme === 'custom' && modeTheme.customVars) {
        setCustomThemeVarsAll(modeTheme.customVars)
      }
    }
  }, [appMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-open welcome modal when triggered from Settings
  useEffect(() => {
    if (welcomeTrigger > 0) setShowWelcome(true)
  }, [welcomeTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isMobile) {
    return (
      <>
        <MobileLayout />
        <CommandPalette />
        <SessionSummaryModal />
        <ScoreboardModal />
        <AddTaskModal />
        <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
        <ToastContainer />
      </>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <Header />
      <main className="flex-1 flex p-3 gap-2 min-h-0 overflow-hidden">
        {!isHyperFocus && (
          <>
            <div className="flex-1 min-w-0 overflow-hidden">
              <LeftPanel />
            </div>
            <ResizeHandle direction="horizontal" onPointerDown={onPointerDown} />
          </>
        )}
        <div className={isHyperFocus ? 'flex-1 overflow-hidden' : 'flex-shrink-0 overflow-hidden'} style={isHyperFocus ? {} : { width: `${rightWidth}px` }}>
          <RightPanel />
        </div>
      </main>
      <CommandPalette />
      <SessionSummaryModal />
      <ScoreboardModal />
      <AddTaskModal />
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
      <ToastContainer />
    </div>
  )
}
