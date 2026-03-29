import { ResizeHandle } from '../ui/ResizeHandle'
import { useResize } from '../../hooks/useResize'
import { PomodoroTimer } from '../timer/PomodoroTimer'
import { MusicPlayer } from '../music/MusicPlayer'

export function RightPanel() {
  const { size: timerHeight, onPointerDown } = useResize({
    direction: 'vertical',
    initial: 320,
    min: 200,
    max: 520,
    invert: false,  // drag down → timer grows
    storageKey: 'studysesh-timer-height',
  })

  return (
    <div className="flex flex-col h-full" style={{ gap: 0 }}>
      <div
        className="rounded-xl flex-shrink-0 overflow-hidden"
        style={{ height: `${timerHeight}px`, background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
      >
        <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Pomodoro Timer</h2>
        </div>
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
          <PomodoroTimer />
        </div>
      </div>

      <ResizeHandle direction="vertical" onPointerDown={onPointerDown} />

      <div
        className="rounded-xl flex-1 min-h-0 overflow-hidden"
        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
      >
        <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Music</h2>
        </div>
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
          <MusicPlayer />
        </div>
      </div>
    </div>
  )
}
