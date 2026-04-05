import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppMode = 'study' | 'personal'

interface UIStore {
  musicPanelVisible: boolean
  sessionPanelVisible: boolean
  isHyperFocus: boolean
  mode: AppMode
  welcomeTrigger: number   // increments to signal App.tsx to open welcome modal (not persisted)
  toggleMusicPanel: () => void
  toggleSessionPanel: () => void
  toggleHyperFocus: () => void
  toggleMode: () => void
  triggerWelcome: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      musicPanelVisible: true,
      sessionPanelVisible: true,
      isHyperFocus: false,
      mode: 'study',
      welcomeTrigger: 0,
      toggleMusicPanel: () => set((s) => ({ musicPanelVisible: !s.musicPanelVisible })),
      toggleSessionPanel: () => set((s) => ({ sessionPanelVisible: !s.sessionPanelVisible })),
      toggleHyperFocus: () => set((s) => ({ isHyperFocus: !s.isHyperFocus })),
      toggleMode: () => set((s) => ({ mode: s.mode === 'study' ? 'personal' : 'study' })),
      triggerWelcome: () => set((s) => ({ welcomeTrigger: s.welcomeTrigger + 1 })),
    }),
    {
      name: 'studysesh-ui',
      // Don't persist the trigger counter — it's ephemeral
      partialize: (s) => ({
        musicPanelVisible: s.musicPanelVisible,
        sessionPanelVisible: s.sessionPanelVisible,
        isHyperFocus: s.isHyperFocus,
        mode: s.mode,
      }),
    }
  )
)
