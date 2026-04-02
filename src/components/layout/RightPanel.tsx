import { ChevronUp, ChevronDown } from 'lucide-react'
import { ResizeHandle } from '../ui/ResizeHandle'
import { useResize } from '../../hooks/useResize'
import { PomodoroTimer } from '../timer/PomodoroTimer'
import { MusicPlayer } from '../music/MusicPlayer'
import { useUIStore } from '../../stores/uiStore'
import { useMusicStore } from '../../stores/musicStore'

export function RightPanel() {
  const { musicPanelVisible, isHyperFocus, toggleMusicPanel } = useUIStore()
  const { setPlaying } = useMusicStore()
  const { size: timerHeight, onPointerDown } = useResize({
    direction: 'vertical',
    initial: 320,
    min: 200,
    max: 520,
    invert: false,
    storageKey: 'studysesh-timer-height',
  })

  const handleToggleMusic = () => {
    if (musicPanelVisible) {
      // Pause music before hiding
      setPlaying(false)
    }
    toggleMusicPanel()
  }

  if (isHyperFocus) {
    return (
      <div
        className="rounded-xl h-full overflow-hidden flex flex-col"
        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
      >
        <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Pomodoro Timer</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
          <PomodoroTimer />
        </div>
      </div>
    )
  }

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

      {musicPanelVisible ? (
        <div
          className="rounded-xl flex-1 min-h-0 overflow-hidden"
          style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
        >
          <div className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Music</h2>
            <button
              onClick={handleToggleMusic}
              title="Collapse music player"
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronUp size={13} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
            <MusicPlayer />
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl flex-shrink-0 flex items-center justify-between px-4 py-2"
          style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Music</span>
          <button
            onClick={toggleMusicPanel}
            title="Show music player"
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
