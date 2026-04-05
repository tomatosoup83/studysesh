import { useState, useEffect } from 'react'
import { Brain, Flower2, Keyboard, Zap, Settings, LogOut } from 'lucide-react'
import { useCommandStore } from '../../stores/commandStore'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useToastStore } from '../../stores/toastStore'
import { ProfileModal } from '../auth/ProfileModal'
import { SettingsModal } from '../settings/SettingsModal'
import { api } from '../../lib/api'

export function Header() {
  const { openPalette } = useCommandStore()
  const { user, logout } = useAuthStore()
  const { isHyperFocus, toggleHyperFocus, mode, toggleMode } = useUIStore()
  const { addToast } = useToastStore()
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [quote, setQuote] = useState('')

  // Fetch random quote from server
  useEffect(() => {
    api.quotes.getAll().then((res) => {
      if (res.quotes.length > 0) {
        const q = res.quotes[Math.floor(Math.random() * res.quotes.length)]
        setQuote(q.text)
      }
    }).catch(() => {})
  }, [])

  const initials = user?.displayName?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {mode === 'personal'
          ? <Flower2 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          : <Brain size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        }
        <span className="font-bold text-base tracking-tight flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
          StudySesh
        </span>
        {quote && (
          <span
            className="text-xs italic truncate hidden sm:block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {quote}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <button
          onClick={() => {
            const nextMode = mode === 'study' ? 'personal' : 'study'
            toggleMode()
            addToast(`Switched to ${nextMode === 'study' ? 'Study' : 'Personal'} mode`, 'info')
          }}
          title={mode === 'study' ? 'Switch to Personal mode' : 'Switch to Study mode'}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}
        >
          {mode === 'study'
            ? <Flower2 size={14} />
            : <Brain size={14} />
          }
        </button>

        {/* Hyper focus toggle */}
        <button
          onClick={toggleHyperFocus}
          title={isHyperFocus ? 'Exit hyper focus' : 'Hyper focus mode'}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: isHyperFocus ? 'var(--color-primary)' : 'var(--color-surface-3)',
            color: isHyperFocus ? 'white' : 'var(--color-text-muted)',
          }}
        >
          <Zap size={14} />
        </button>

        {/* Command palette */}
        <button
          onClick={openPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
        >
          <Keyboard size={12} />
          <span>⌘K</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}
        >
          <Settings size={14} />
        </button>

        {/* User avatar + display name */}
        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors"
              style={{ background: 'var(--color-surface-3)' }}
              title="Edit profile"
            >
              {user.avatarBase64 ? (
                <img src={user.avatarBase64} alt="avatar" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  {initials}
                </div>
              )}
              <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--color-text-primary)' }}>
                {user.displayName}
              </span>
            </button>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  )
}
