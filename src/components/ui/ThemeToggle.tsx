import { Sun, Moon, BookOpen } from 'lucide-react'
import { useSettingsStore, Theme } from '../../stores/settingsStore'

export function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore()
  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'dark', icon: <Moon size={13} />, label: 'Dark' },
    { value: 'light', icon: <Sun size={13} />, label: 'Light' },
    { value: 'paper', icon: <BookOpen size={13} />, label: 'Paper' },
  ]
  return (
    <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--color-surface-3)' }}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          className="p-1.5 rounded-md transition-all"
          style={{
            background: theme === t.value ? 'var(--color-primary)' : 'transparent',
            color: theme === t.value ? 'white' : 'var(--color-text-muted)',
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
