import { ChevronUp, ChevronDown } from 'lucide-react'
import { KanbanBoard } from '../board/KanbanBoard'
import { SessionTracker } from '../session/SessionTracker'
import { ResizeHandle } from '../ui/ResizeHandle'
import { useResize } from '../../hooks/useResize'
import { useUIStore } from '../../stores/uiStore'

export function LeftPanel() {
  const { sessionPanelVisible, toggleSessionPanel } = useUIStore()
  const { size: sessionHeight, onPointerDown } = useResize({
    direction: 'vertical',
    initial: 220,
    min: 100,
    max: 480,
    invert: false,
    storageKey: 'studysesh-session-height',
  })

  return (
    <div className="flex flex-col h-full" style={{ gap: 0 }}>
      {/* Session tracker — resizable */}
      {sessionPanelVisible ? (
        <>
          <div style={{ height: `${sessionHeight}px`, flexShrink: 0, position: 'relative' }}>
            <SessionTracker onToggleHide={toggleSessionPanel} />
          </div>
          <ResizeHandle direction="vertical" onPointerDown={onPointerDown} />
        </>
      ) : (
        /* Collapsed session panel — just a slim header bar */
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl flex-shrink-0 mb-1"
          style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Session</span>
          <button
            onClick={toggleSessionPanel}
            title="Show session tracker"
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}

      {/* Task board — fills remaining height */}
      <div
        className="flex-1 min-h-0 overflow-hidden rounded-xl"
        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Task Board
          </h2>
        </div>
        <div className="h-full" style={{ height: 'calc(100% - 40px)' }}>
          <KanbanBoard />
        </div>
      </div>
    </div>
  )
}
