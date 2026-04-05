import { useState, useEffect } from 'react'
import { Brain, X, PlayCircle, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useTaskModalStore } from '../../stores/taskModalStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { api } from '../../lib/api'

interface Props {
  open: boolean
  onClose: () => void
}

type AuthTab = 'login' | 'register'

export function WelcomeModal({ open, onClose }: Props) {
  const { user, isLoading, error, login, register, clearError } = useAuthStore()
  const { startSession } = useSessionStore()
  const { open: openTaskModal } = useTaskModalStore()
  const { showWelcomeOnStart, setShowWelcomeOnStart } = useSettingsStore()

  const [quote, setQuote] = useState('')
  const [changelog, setChangelog] = useState('')
  const [tab, setTab] = useState<AuthTab>('login')
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Auth form fields
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [regLoginName, setRegLoginName] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return
    // Fetch a random quote
    api.quotes.getAll().then((res) => {
      if (res.quotes.length > 0) {
        const q = res.quotes[Math.floor(Math.random() * res.quotes.length)]
        setQuote(q.text)
      }
    }).catch(() => {})
    // Fetch changelog
    fetch(import.meta.env.BASE_URL + 'changelog.txt')
      .then((r) => r.text())
      .then(setChangelog)
      .catch(() => {})
  }, [open])

  // Prevent Escape from closing when not logged in
  useEffect(() => {
    if (!open || user) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') e.stopPropagation() }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [open, user])

  if (!open) return null

  const switchTab = (t: AuthTab) => { setTab(t); clearError(); setLocalError('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!loginName.trim() || !password) return
    try { await login(loginName.trim(), password) } catch { /* error in store */ }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (regPassword !== regConfirm) { setLocalError('Passwords do not match'); return }
    try { await register(regLoginName.trim(), regDisplayName.trim(), regPassword) } catch { /* error in store */ }
  }

  const displayError = localError || error

  const handleClose = () => {
    if (dontShowAgain) setShowWelcomeOnStart(false)
    onClose()
  }

  const handleStartSession = () => {
    startSession()
    handleClose()
  }

  const handleAddTask = () => {
    openTaskModal()
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — only clickable if logged in */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={user ? handleClose : undefined}
      />
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={20} style={{ color: 'var(--color-primary)' }} />
              <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                StudySesh
              </span>
            </div>
            {user && (
              <button
                onClick={handleClose}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {quote && (
            <p
              className="text-xs italic mt-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              "{quote}"
            </p>
          )}
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {!user ? (
            /* Auth form */
            <div className="space-y-4">
              {/* Tab toggle */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                {(['login', 'register'] as AuthTab[]).map((t) => (
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
                  {displayError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{displayError}</p>}
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
                  {displayError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{displayError}</p>}
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
            </div>
          ) : (
            /* Logged-in view */
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Hey, {user.displayName}! Ready to get started?
              </p>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleStartSession}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium text-sm transition-colors"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  <PlayCircle size={22} />
                  Start Session
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium text-sm transition-colors"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <Plus size={22} />
                  Add Task
                </button>
              </div>

              {/* Changelog */}
              {changelog && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    What's new
                  </p>
                  <textarea
                    readOnly
                    value={changelog}
                    rows={8}
                    className="w-full text-xs px-3 py-2.5 rounded-xl outline-none resize-none font-mono leading-relaxed"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  />
                </div>
              )}

              {/* Don't show again */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[var(--color-primary)]"
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Don't show again on startup
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
