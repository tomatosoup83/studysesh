import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useAuthStore } from '../../stores/authStore'

type Tab = 'login' | 'register'

export function AuthModal() {
  const { user, isLoading, error, login, register, clearError } = useAuthStore()
  const [tab, setTab] = useState<Tab>('login')

  // Login fields
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regLoginName, setRegLoginName] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  if (user) return null

  const switchTab = (t: Tab) => {
    setTab(t)
    clearError()
    setLocalError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!loginName.trim() || !password) return
    try {
      await login(loginName.trim(), password)
    } catch {
      // error is in store
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (regPassword !== regConfirm) {
      setLocalError('Passwords do not match')
      return
    }
    try {
      await register(regLoginName.trim(), regDisplayName.trim(), regPassword)
    } catch {
      // error is in store
    }
  }

  const displayError = localError || error

  return (
    <Modal open onClose={() => {}} title="Welcome to StudySesh" size="sm">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
        {(['login', 'register'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
            style={{
              background: tab === t ? 'var(--color-primary)' : 'transparent',
              color: tab === t ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="Username"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          {displayError && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{displayError}</p>}
          <button
            type="submit"
            disabled={isLoading || !loginName.trim() || !password}
            className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="Display name (shown to others)"
            value={regDisplayName}
            onChange={(e) => setRegDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <input
            type="text"
            placeholder="Username (for login)"
            value={regLoginName}
            onChange={(e) => setRegLoginName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={regConfirm}
            onChange={(e) => setRegConfirm(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          {displayError && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{displayError}</p>}
          <button
            type="submit"
            disabled={isLoading || !regLoginName.trim() || !regDisplayName.trim() || !regPassword || !regConfirm}
            className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}
    </Modal>
  )
}
