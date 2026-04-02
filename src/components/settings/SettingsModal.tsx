import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Slider } from '../ui/Slider'
import { useSettingsStore, Theme } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'
import { useTimerStore } from '../../stores/timerStore'
import { ProfileModal } from '../auth/ProfileModal'
import { api } from '../../lib/api'
import type { QuoteItem } from '../../types/api'

interface Props {
  open: boolean
  onClose: () => void
}

type Section = 'account' | 'appearance' | 'timer' | 'privacy' | 'quotes'

const THEMES: { value: Theme; label: string; primary: string; bg: string }[] = [
  { value: 'dark', label: 'Dark', primary: '#818cf8', bg: '#0f172a' },
  { value: 'light', label: 'Light', primary: '#6366f1', bg: '#ffffff' },
  { value: 'paper', label: 'Paper', primary: '#92400e', bg: '#fffbeb' },
  { value: 'ocean', label: 'Ocean', primary: '#38bdf8', bg: '#071220' },
  { value: 'forest', label: 'Forest', primary: '#4ade80', bg: '#081208' },
  { value: 'sunset', label: 'Sunset', primary: '#fb923c', bg: '#140a02' },
]

export function SettingsModal({ open, onClose }: Props) {
  const [section, setSection] = useState<Section>('account')
  const [showProfile, setShowProfile] = useState(false)
  const { theme, setTheme, timerDurations, setTimerDuration, autoStartBreaks, setAutoStartBreaks,
    longBreakInterval, setLongBreakInterval, notificationsEnabled, setNotificationsEnabled,
    shareLastTask, setShareLastTask } = useSettingsStore()
  const { user } = useAuthStore()
  const { reset } = useTimerStore()

  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [newQuote, setNewQuote] = useState('')
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    if (open && section === 'quotes') {
      api.quotes.getAll().then((r) => setQuotes(r.quotes)).catch(() => {})
    }
  }, [open, section])

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuoteError('')
    if (!newQuote.trim()) return
    setQuoteSaving(true)
    try {
      const q = await api.quotes.add(newQuote.trim())
      setQuotes((prev) => [q, ...prev])
      setNewQuote('')
    } catch (err) {
      setQuoteError((err as Error).message)
    } finally {
      setQuoteSaving(false)
    }
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'timer', label: 'Timer' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'quotes', label: 'Quotes' },
  ]

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings" size="lg">
        <div className="flex gap-4" style={{ minHeight: 300 }}>
          {/* Sidebar */}
          <div className="flex flex-col gap-0.5 flex-shrink-0" style={{ width: 110 }}>
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: section === s.key ? 'var(--color-primary)' : 'transparent',
                  color: section === s.key ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px flex-shrink-0" style={{ background: 'var(--color-border)' }} />

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 400 }}>
            {section === 'account' && (
              <div className="space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      {user.avatarBase64 ? (
                        <img src={user.avatarBase64} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ background: 'var(--color-primary)', color: 'white' }}>
                          {user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{user.displayName}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>@{user.loginName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfile(true)}
                      className="px-4 py-2 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--color-primary)', color: 'white' }}
                    >
                      Edit profile
                    </button>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not logged in.</p>
                )}
              </div>
            )}

            {section === 'appearance' && (
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                      style={{
                        background: t.bg,
                        border: `2px solid ${theme === t.value ? t.primary : 'transparent'}`,
                        color: t.primary,
                      }}
                    >
                      <div className="w-6 h-6 rounded-full" style={{ background: t.primary }} />
                      <span style={{ color: theme === t.value ? t.primary : '#888', fontSize: '0.65rem' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {section === 'timer' && (
              <div className="space-y-4">
                {([
                  { label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 60 * 60 },
                  { label: 'Short Break', key: 'shortBreak' as const, min: 60, max: 30 * 60 },
                  { label: 'Long Break', key: 'longBreak' as const, min: 5 * 60, max: 45 * 60 },
                ] as const).map(({ label, key, min, max }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={min / 60} max={max / 60}
                          value={timerDurations[key] / 60}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (!isNaN(v) && v * 60 >= min && v * 60 <= max) {
                              setTimerDuration(key, v * 60)
                              reset(useSettingsStore.getState().timerDurations)
                            }
                          }}
                          className="w-12 px-1.5 py-0.5 rounded text-xs text-center outline-none"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                        <span style={{ color: 'var(--color-text-muted)' }}>min</span>
                      </div>
                    </div>
                    <Slider value={timerDurations[key]} onChange={(v) => { setTimerDuration(key, v); reset(useSettingsStore.getState().timerDurations) }} min={min} max={max} step={60} />
                  </div>
                ))}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Long break every</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{longBreakInterval} pomodoros</span>
                  </div>
                  <Slider value={longBreakInterval} onChange={setLongBreakInterval} min={2} max={8} />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={autoStartBreaks} onChange={(e) => setAutoStartBreaks(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>Auto-start breaks</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>Desktop notifications</span>
                </label>
              </div>
            )}

            {section === 'privacy' && (
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shareLastTask}
                    onChange={(e) => setShareLastTask(e.target.checked)}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Share last completed task on leaderboard</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      When enabled, others can see your most recently completed task. If disabled, they'll see "hidden by user"
                    </p>
                  </div>
                </label>
              </div>
            )}

            {section === 'quotes' && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Add quotes that will appear for everyone in the header.
                </p>
                <form onSubmit={handleAddQuote} className="flex gap-2">
                  <input
                    type="text"
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="Add a quote..."
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <button
                    type="submit"
                    disabled={quoteSaving || !newQuote.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    Add
                  </button>
                </form>
                {quoteError && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{quoteError}</p>}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
                    >
                      <p>{q.text}</p>
                      {q.addedBy && <p className="mt-0.5" style={{ color: 'var(--color-text-muted)' }}>— {q.addedBy}</p>}
                    </div>
                  ))}
                  {quotes.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No quotes yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </>
  )
}
