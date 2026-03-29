import { Brain, Keyboard } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useCommandStore } from '../../stores/commandStore'

export function Header() {
  const { openPalette } = useCommandStore()

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2">
        <Brain size={20} style={{ color: 'var(--color-primary)' }} />
        <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          StudySesh
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={openPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            background: 'var(--color-surface-3)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Keyboard size={12} />
          <span>⌘K</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
