import { useState } from 'react'
import { Music2, X } from 'lucide-react'
import { MusicPlayer } from './MusicPlayer'
import { useIsMobile } from '../../hooks/useIsMobile'

interface Props {
  buttonClassName?: string
  buttonStyle?: React.CSSProperties
}

export function MusicPopupButton({ buttonClassName, buttonStyle }: Props) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  // On mobile, offset from bottom to clear the nav bar (~56px) + some padding
  const bottomOffset = isMobile ? 68 : 12

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close music player' : 'Open music player'}
        className={buttonClassName}
        style={buttonStyle}
      >
        <Music2 size={15} />
      </button>

      {/* Always mounted so YouTubePlayer iframe stays alive; toggled with display */}
      <div
        style={{
          display: open ? 'flex' : 'none',
          position: 'fixed',
          bottom: bottomOffset,
          right: 12,
          width: 284,
          flexDirection: 'column',
          zIndex: 200,
          background: 'var(--color-panel-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Music</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={13} />
          </button>
        </div>
        <div className="p-4" style={{ height: 260 }}>
          <MusicPlayer />
        </div>
      </div>
    </>
  )
}
