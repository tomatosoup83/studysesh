import { useState } from 'react'
import { Clock, BarChart2, CheckSquare, User, Settings } from 'lucide-react'
import { Header } from '../header/Header'
import { RightPanel } from './RightPanel'
import { SessionTracker } from '../session/SessionTracker'
import { KanbanBoard } from '../board/KanbanBoard'
import { SettingsModal } from '../settings/SettingsModal'
import { ProfileModal } from '../auth/ProfileModal'
import { useAuthStore } from '../../stores/authStore'

type MobileTab = 'timer' | 'session' | 'tasks' | 'profile'

function MobileProfileTab() {
  const { user } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div
      className="h-full rounded-xl flex flex-col overflow-hidden"
      style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
    >
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Profile</h2>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              {user.displayName?.slice(0, 2).toUpperCase() ?? '??'}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user.displayName}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>@{user.loginName}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <Settings size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm font-medium">Settings</span>
        </button>
        {user && (
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          >
            <User size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium">Edit Profile</span>
          </button>
        )}
      </div>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      {user && <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />}
    </div>
  )
}

function MobileBottomNav({ activeTab, onTabChange }: { activeTab: MobileTab; onTabChange: (t: MobileTab) => void }) {
  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'timer',   label: 'Timer',   icon: <Clock size={20} /> },
    { id: 'session', label: 'Session', icon: <BarChart2 size={20} /> },
    { id: 'tasks',   label: 'Tasks',   icon: <CheckSquare size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ]

  return (
    <nav
      className="flex-shrink-0 flex border-t"
      style={{ background: 'var(--color-panel-bg)', borderColor: 'var(--color-border)' }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors"
            style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function MobileLayout() {
  const [tab, setTab] = useState<MobileTab>('timer')

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden p-2">
        {tab === 'timer'   && <RightPanel />}
        {tab === 'session' && (
          <div
            className="h-full rounded-xl overflow-hidden"
            style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
          >
            <SessionTracker />
          </div>
        )}
        {tab === 'tasks'   && (
          <div
            className="h-full rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)' }}
          >
            <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Task Board</h2>
            </div>
            <div className="flex-1 min-h-0">
              <KanbanBoard />
            </div>
          </div>
        )}
        {tab === 'profile' && <MobileProfileTab />}
      </main>
      <MobileBottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
