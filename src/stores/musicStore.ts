import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MusicMode, YouTubeTrack, YouTubeConfig } from '../types/music'

const LOFI_PLAYLIST: YouTubeTrack[] = [
  { id: 'l1', title: 'Lofi Hip Hop Radio', videoId: 'jfKfPfyJRdk' },
  { id: 'l2', title: 'Chillhop Essentials', videoId: '5yx6BWlEVcY' },
  { id: 'l3', title: 'Lofi Study Beats', videoId: 'lTRiuFIWV54' },
  { id: 'l4', title: 'Jazz Lofi Hip Hop', videoId: 'DSGyEsJ17cI' },
  { id: 'l5', title: 'Deep Focus Music', videoId: 'OeELwSyFuj8' },
]

const AMBIENT_PLAYLIST: YouTubeTrack[] = [
  { id: 'a1', title: 'Rain Sounds', videoId: 'q76bMs-NwRk' },
  { id: 'a2', title: 'Coffee Shop', videoId: 'gaGrHBOqRoE' },
  { id: 'a3', title: 'Forest & Birds', videoId: 'Qm846KdZN_c' },
  { id: 'a4', title: 'Ocean Waves', videoId: 'V1bFr2SWP1I' },
  { id: 'a5', title: 'White Noise', videoId: 'nMfPqeZjc2c' },
  { id: 'a6', title: 'Fireplace', videoId: 'L_LUpnjgPso' },
]

interface MusicStore {
  mode: MusicMode
  lofi: YouTubeConfig
  ambient: YouTubeConfig
  setMode: (mode: MusicMode) => void
  // Operate on whichever tab is active
  setPlaying: (playing: boolean) => void
  setVolume: (v: number) => void
  nextTrack: () => void
  prevTrack: () => void
  setTrackIndex: (i: number) => void
  // Compat alias for command palette (always targets lofi)
  setYouTubePlaying: (v: boolean) => void
}

const wrap = (i: number, len: number) => ((i % len) + len) % len

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      mode: 'youtube',
      lofi:    { isPlaying: false, currentTrackIndex: 0, playlist: LOFI_PLAYLIST,    volume: 70 },
      ambient: { isPlaying: false, currentTrackIndex: 0, playlist: AMBIENT_PLAYLIST, volume: 70 },

      setMode: (mode) => set({ mode }),

      setPlaying: (isPlaying) =>
        set((s) => s.mode === 'youtube'
          ? { lofi:    { ...s.lofi,    isPlaying } }
          : { ambient: { ...s.ambient, isPlaying } }),

      setVolume: (volume) =>
        set((s) => s.mode === 'youtube'
          ? { lofi:    { ...s.lofi,    volume } }
          : { ambient: { ...s.ambient, volume } }),

      nextTrack: () =>
        set((s) => s.mode === 'youtube'
          ? { lofi:    { ...s.lofi,    currentTrackIndex: wrap(s.lofi.currentTrackIndex + 1,    s.lofi.playlist.length) } }
          : { ambient: { ...s.ambient, currentTrackIndex: wrap(s.ambient.currentTrackIndex + 1, s.ambient.playlist.length) } }),

      prevTrack: () =>
        set((s) => s.mode === 'youtube'
          ? { lofi:    { ...s.lofi,    currentTrackIndex: wrap(s.lofi.currentTrackIndex - 1,    s.lofi.playlist.length) } }
          : { ambient: { ...s.ambient, currentTrackIndex: wrap(s.ambient.currentTrackIndex - 1, s.ambient.playlist.length) } }),

      setTrackIndex: (i) =>
        set((s) => s.mode === 'youtube'
          ? { lofi:    { ...s.lofi,    currentTrackIndex: i } }
          : { ambient: { ...s.ambient, currentTrackIndex: i } }),

      setYouTubePlaying: (isPlaying) =>
        set((s) => ({ lofi: { ...s.lofi, isPlaying } })),
    }),
    {
      name: 'studysesh-music',
      partialize: (s) => ({
        mode: s.mode,
        lofi:    { ...s.lofi,    isPlaying: false },
        ambient: { ...s.ambient, isPlaying: false },
      }),
    }
  )
)
