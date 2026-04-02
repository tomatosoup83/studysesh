import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types/api'

interface AuthStore {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  login: (loginName: string, password: string) => Promise<void>
  register: (loginName: string, displayName: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: { displayName?: string; password?: string; avatarBase64?: string | null }) => Promise<void>
  hydrateFromToken: () => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (loginName, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginName, password }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Login failed')
          set({ token: data.token, user: data.user, isLoading: false })
        } catch (e) {
          set({ isLoading: false, error: (e as Error).message })
          throw e
        }
      },

      register: async (loginName, displayName, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginName, displayName, password }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Registration failed')
          set({ token: data.token, user: data.user, isLoading: false })
        } catch (e) {
          set({ isLoading: false, error: (e as Error).message })
          throw e
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null })
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        try {
          const { token } = get()
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(updates),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Update failed')
          set({ user: data.user, isLoading: false })
        } catch (e) {
          set({ isLoading: false, error: (e as Error).message })
          throw e
        }
      },

      hydrateFromToken: async () => {
        const { token } = get()
        if (!token) return false
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            set({ token: null, user: null })
            return false
          }
          const data = await res.json()
          set({ user: data.user })
          return true
        } catch {
          return false
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studysesh-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
)
