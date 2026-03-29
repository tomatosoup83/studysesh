import { useRef } from 'react'
import { Music, Wind } from 'lucide-react'
import { useMusicStore } from '../../stores/musicStore'
import { YouTubePlayer } from './YouTubePlayer'
import { YouTubeControls } from './YouTubeControls'

export function MusicPlayer() {
  const playerRef = useRef<any>(null)
  const { mode, setMode } = useMusicStore()

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Hidden YouTube iframe — always in DOM, shared by both tabs */}
      <YouTubePlayer onReady={(p) => { playerRef.current = p }} />

      <div className="flex gap-1 p-0.5 rounded-lg flex-shrink-0" style={{ background: 'var(--color-surface-3)' }}>
        {(['youtube', 'ambient'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'var(--color-primary)' : 'transparent',
              color: mode === m ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {m === 'youtube' ? <><Music size={11} /> Lo-fi</> : <><Wind size={11} /> Ambient</>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Both modes use the same controls — the store switches the active playlist */}
        <YouTubeControls playerRef={playerRef} />
      </div>
    </div>
  )
}
