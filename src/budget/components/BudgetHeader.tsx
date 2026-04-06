import { useState } from 'react'
import { Wallet, BookOpen, BarChart2, Trophy, Settings, LogOut, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useBudgetTransactionModalStore } from '../../stores/budgetTransactionModalStore'
import { SettingsModal } from '../../components/settings/SettingsModal'
import { formatCombo } from '../../stores/shortcutsStore'
import { useShortcutsStore } from '../../stores/shortcutsStore'

interface Props {
  onOpenGraphs: () => void
  onOpenLeaderboard: () => void
}

export function BudgetHeader({ onOpenGraphs, onOpenLeaderboard }: Props) {
  const { user, logout } = useAuthStore()
  const { open: openTxModal } = useBudgetTransactionModalStore()
  const [showSettings, setShowSettings] = useState(false)
  const { bindings } = useShortcutsStore()

  return (
    <>
      <header
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 48, borderBottom: '1px solid var(--color-border)', background: 'var(--color-panel-bg)' }}
      >
        {/* App name */}
        <div className="flex items-center gap-2">
          <Wallet size={18} style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Budget Tracker</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Add transaction */}
          <button
            onClick={() => openTxModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--color-primary)', color: 'white' }}
            title={`Add transaction (${formatCombo(bindings['budget-transaction-add'])})`}
          >
            <Plus size={12} />
            Add
          </button>

          {/* Graphs */}
          <button
            onClick={onOpenGraphs}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Spending graphs"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <BarChart2 size={16} />
          </button>

          {/* Leaderboard */}
          <button
            onClick={onOpenLeaderboard}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Leaderboard"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Trophy size={16} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Settings"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={16} />
          </button>

          {/* Back to StudySesh */}
          <a
            href="/study"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', border: '1px solid var(--color-border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <BookOpen size={13} />
            StudySesh
          </a>

          {/* Avatar */}
          {user && (
            <div className="flex items-center gap-2 ml-1">
              {user.avatarBase64 ? (
                <img src={user.avatarBase64} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Log out"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
