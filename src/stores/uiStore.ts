import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  musicPanelVisible: boolean
  sessionPanelVisible: boolean
  isHyperFocus: boolean
  toggleMusicPanel: () => void
  toggleSessionPanel: () => void
  toggleHyperFocus: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      musicPanelVisible: true,
      sessionPanelVisible: true,
      isHyperFocus: false,
      toggleMusicPanel: () => set((s) => ({ musicPanelVisible: !s.musicPanelVisible })),
      toggleSessionPanel: () => set((s) => ({ sessionPanelVisible: !s.sessionPanelVisible })),
      toggleHyperFocus: () => set((s) => ({ isHyperFocus: !s.isHyperFocus })),
    }),
    { name: 'studysesh-ui' }
  )
)
