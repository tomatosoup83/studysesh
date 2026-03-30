import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useCommandStore } from '../../stores/commandStore'
import { useCommandActions } from '../../hooks/useCommandActions'
import { useTaskModalStore } from '../../stores/taskModalStore'
import { COMMAND_CATEGORIES } from '../../lib/commands'

export function CommandPalette() {
  const { open, closePalette, recentCommandIds, addRecentCommand } = useCommandStore()
  const { open: openTaskModal } = useTaskModalStore()
  const commands = useCommandActions(openTaskModal)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? closePalette() : useCommandStore.getState().openPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closePalette])

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
              placeholder="Search commands…"
              autoFocus
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
            />
          </div>
          <Command.List style={{ maxHeight: 380, overflowY: 'auto' }}>
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
      {cmd.hint && <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>{cmd.hint}</span>}
    </Command.Item>
  )
}
