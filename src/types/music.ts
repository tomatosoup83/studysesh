export type MusicMode = 'youtube' | 'ambient'

export interface YouTubeTrack {
  id: string
  title: string
  videoId: string
}

export interface YouTubeConfig {
  isPlaying: boolean
  currentTrackIndex: number
  playlist: YouTubeTrack[]
  volume: number
}
