import { KanbanBoard } from '../board/KanbanBoard'
import { SessionTracker } from '../session/SessionTracker'
import { ResizeHandle } from '../ui/ResizeHandle'
import { useResize } from '../../hooks/useResize'

export function LeftPanel() {
  const { size: sessionHeight, onPointerDown } = useResize({
    direction: 'vertical',
    initial: 220,
    min: 100,
    max: 480,
    invert: false,   // drag handle down → session panel grows
    storageKey: 'studysesh-session-height',
  })

  return (
    <div className="flex flex-col h-full" style={{ gap: 0 }}>
      {/* Session tracker — resizable */}
      <div style={{ height: `${sessionHeight}px`, flexShrink: 0 }}>
        <SessionTracker />
      </div>

      <ResizeHandle direction="vertical" onPointerDown={onPointerDown} />

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
