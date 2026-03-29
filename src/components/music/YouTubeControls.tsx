import { useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useMusicStore } from '../../stores/musicStore'
import { Slider } from '../ui/Slider'

interface YouTubeControlsProps {
  playerRef: React.MutableRefObject<any>
}

export function YouTubeControls({ playerRef }: YouTubeControlsProps) {
  const { mode, lofi, ambient, setPlaying, setVolume, nextTrack, prevTrack, setTrackIndex } = useMusicStore()

  // Whichever tab is visible gets its config surfaced here
  const active = mode === 'youtube' ? lofi : ambient
  const currentTrack = active.playlist[active.currentTrackIndex]

  useEffect(() => {
    if (!playerRef.current) return
    playerRef.current.setVolume(active.volume)
  }, [active.volume])

  useEffect(() => {
    if (!playerRef.current) return
    if (active.isPlaying) playerRef.current.playVideo()
    else playerRef.current.pauseVideo()
  }, [active.isPlaying, active.currentTrackIndex])

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {currentTrack?.title ?? 'No track'}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {active.currentTrackIndex + 1} / {active.playlist.length}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={prevTrack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}>
          <SkipBack size={13} />
        </button>
        <button
          onClick={() => setPlaying(!active.isPlaying)}
          className="p-2.5 rounded-full transition-all active:scale-95"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          {active.isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={nextTrack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}>
          <SkipForward size={13} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <Slider value={active.volume} onChange={setVolume} min={0} max={100} />
        <span className="text-[10px] w-5 text-right tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {active.volume}
        </span>
      </div>

      <div className="space-y-0.5 max-h-32 overflow-y-auto">
        {active.playlist.map((track, i) => (
          <button
            key={track.id}
            onClick={() => { setTrackIndex(i); setPlaying(true) }}
            className="w-full text-left px-2 py-1 rounded text-[11px] transition-colors truncate"
            style={{
              background: i === active.currentTrackIndex
                ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                : 'transparent',
              color: i === active.currentTrackIndex
                ? 'var(--color-primary)'
                : 'var(--color-text-secondary)',
            }}
          >
            {i + 1}. {track.title}
          </button>
        ))}
      </div>
    </div>
  )
}
