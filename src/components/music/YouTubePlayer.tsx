import YouTube, { YouTubeEvent } from 'react-youtube'
import { useMusicStore } from '../../stores/musicStore'

interface YouTubePlayerProps {
  onReady: (player: any) => void
}

export function YouTubePlayer({ onReady }: YouTubePlayerProps) {
  const { mode, lofi, ambient, nextTrack, setPlaying } = useMusicStore()

  const active = mode === 'youtube' ? lofi : ambient
  const currentTrack = active.playlist[active.currentTrackIndex]

  const handleReady = (e: YouTubeEvent) => {
    e.target.setVolume(active.volume)
    onReady(e.target)
    if (active.isPlaying) e.target.playVideo()
  }

  const handleStateChange = (e: YouTubeEvent<number>) => {
    if (e.data === 0) nextTrack()
    else if (e.data === 1) setPlaying(true)
    else if (e.data === 2) setPlaying(false)
  }

  if (!currentTrack) return null

  return (
    <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      {/* key forces remount when video changes so new video loads cleanly */}
      <YouTube
        key={currentTrack.videoId}
        videoId={currentTrack.videoId}
        opts={{ height: '1', width: '1', playerVars: { autoplay: 0, controls: 0 } }}
        onReady={handleReady}
        onStateChange={handleStateChange}
      />
    </div>
  )
}
