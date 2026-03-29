import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  userName: string | null
  setUserName: (name: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userName: null,
      setUserName: (name) => set({ userName: name.trim() }),
    }),
    { name: 'studysesh-user' }
  )
)
