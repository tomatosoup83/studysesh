import { useEffect } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useAuthStore } from './stores/authStore'
import { useTaskStore } from './stores/taskStore'
import { Header } from './components/header/Header'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { ResizeHandle } from './components/ui/ResizeHandle'
import { CommandPalette } from './components/command/CommandPalette'
import { SessionSummaryModal } from './components/session/SessionSummaryModal'
import { AuthModal } from './components/auth/AuthModal'
import { ScoreboardModal } from './components/scoreboard/ScoreboardModal'
import { AddTaskModal } from './components/board/AddTaskModal'
import { useResize } from './hooks/useResize'
import { useTimer } from './hooks/useTimer'
import { useIdleTimer } from './hooks/useIdleTimer'
import { useNotifications } from './hooks/useNotifications'
import { useUIStore } from './stores/uiStore'
import './styles/themes.css'
import './styles/globals.css'

export default function App() {
  const { theme } = useSettingsStore()
  const { user, hydrateFromToken } = useAuthStore()
  const { syncFromServer } = useTaskStore()
  const { isHyperFocus } = useUIStore()

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <Header />
      <main className="flex-1 flex p-3 min-h-0 overflow-hidden" style={{ gap: 0 }}>
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
      <AuthModal />
      <ScoreboardModal />
      <AddTaskModal />
    </div>
  )
}
