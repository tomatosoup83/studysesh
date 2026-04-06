import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useBudgetCommandStore } from '../../stores/budgetCommandStore'
import { useBudgetTransactionModalStore } from '../../stores/budgetTransactionModalStore'
import { useBudgetCommandActions } from '../hooks/useBudgetCommandActions'
import { useShortcutsStore, getKeyCombo } from '../../stores/shortcutsStore'
import { COMMAND_CATEGORIES } from '../../lib/commands'

interface Props {
  onOpenSettings: () => void
  onOpenGraphs: () => void
  onOpenLeaderboard: () => void
}

export function BudgetCommandPalette({ onOpenSettings, onOpenGraphs, onOpenLeaderboard }: Props) {
  const { open, closePalette, recentCommandIds, addRecentCommand } = useBudgetCommandStore()
  const { open: openTxModal } = useBudgetTransactionModalStore()
  const commands = useBudgetCommandActions(openTxModal, onOpenSettings, onOpenGraphs, onOpenLeaderboard)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA'
      const combo = getKeyCombo(e)
      if (!combo) return

      const { bindings } = useShortcutsStore.getState()

      if (combo === bindings['palette-open']) {
        e.preventDefault()
        open ? closePalette() : useBudgetCommandStore.getState().openPalette()
        return
      }

      if (combo === bindings['budget-transaction-add'] && !open && !inInput) {
        e.preventDefault()
        openTxModal()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closePalette, openTxModal])

  if (!open) return null

  const recent = recentCommandIds.map((id) => commands.find((c) => c.id === id)).filter(Boolean) as typeof commands

  const handleSelect = (cmd: (typeof commands)[0]) => {
    addRecentCommand(cmd.id)
    cmd.action()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ paddingTop: '15vh' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePalette} />
      <div
        className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Command>
          <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Command.Input
              placeholder="Search budget commands…"
              autoFocus
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
            />
          </div>
          <Command.List style={{ maxHeight: 420, overflowY: 'auto' }}>
            <Command.Empty className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No commands found.
            </Command.Empty>

            {recent.length > 0 && (
              <Command.Group heading="Recent">
                {recent.map((cmd) => (
                  <CommandItem key={`r-${cmd.id}`} cmd={cmd} onSelect={() => handleSelect(cmd)} />
                ))}
              </Command.Group>
            )}

            {Object.values(COMMAND_CATEGORIES).map((cat) => {
              const items = commands.filter((c) => c.category === cat)
              if (!items.length) return null
              return (
                <Command.Group key={cat} heading={cat}>
                  {items.map((cmd) => (
                    <CommandItem key={cmd.id} cmd={cmd} onSelect={() => handleSelect(cmd)} />
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

function CommandItem({ cmd, onSelect }: { cmd: any; onSelect: () => void }) {
  return (
    <Command.Item
      value={`${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg cursor-pointer text-sm"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {cmd.icon && <cmd.icon size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
      <span>{cmd.label}</span>
      {cmd.shortcut && (
        <kbd
          className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono flex-shrink-0"
          style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          {cmd.shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}
