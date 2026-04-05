import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useCommandStore } from '../../stores/commandStore'
import { useCommandActions } from '../../hooks/useCommandActions'
import { useTaskModalStore } from '../../stores/taskModalStore'
import { useTimerStore } from '../../stores/timerStore'
import { useMusicStore } from '../../stores/musicStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useUIStore } from '../../stores/uiStore'
import { useToastStore } from '../../stores/toastStore'
import { useShortcutsStore, getKeyCombo, formatCombo, SHORTCUT_IDS, SHORTCUT_LABELS } from '../../stores/shortcutsStore'
import { COMMAND_CATEGORIES } from '../../lib/commands'

export function CommandPalette() {
  const { open, closePalette, recentCommandIds, addRecentCommand } = useCommandStore()
  const { open: openTaskModal } = useTaskModalStore()
  const commands = useCommandActions(openTaskModal)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA'
      const combo = getKeyCombo(e)
      if (!combo) return

      const { bindings } = useShortcutsStore.getState()

      if (combo === bindings['palette-open']) {
        e.preventDefault()
        open ? closePalette() : useCommandStore.getState().openPalette()
        return
      }

      if (combo === bindings['task-add'] && !open && !inInput) {
        e.preventDefault()
        openTaskModal()
        return
      }

      if (combo === bindings['timer-toggle']) {
        e.preventDefault()
        const timer = useTimerStore.getState()
        const wasRunning = timer.status === 'running'
        wasRunning ? timer.pause() : timer.start()
        useToastStore.getState().addToast(wasRunning ? 'Timer paused' : 'Timer started', 'info')
        return
      }

      if (combo === bindings['music-toggle']) {
        e.preventDefault()
        const music = useMusicStore.getState()
        const wasPlaying = music.lofi.isPlaying
        music.setYouTubePlaying(!wasPlaying)
        useToastStore.getState().addToast(wasPlaying ? 'Music paused' : 'Music playing', 'info')
        return
      }

      if (combo === bindings['session-toggle']) {
        e.preventDefault()
        const session = useSessionStore.getState()
        if (session.isActive) { session.endSession(); useToastStore.getState().addToast('Session ended', 'info') }
        else { session.startSession(); useToastStore.getState().addToast('Session started', 'success') }
        return
      }

      if (combo === bindings['mode-toggle']) {
        e.preventDefault()
        const ui = useUIStore.getState()
        const nextMode = ui.mode === 'study' ? 'personal' : 'study'
        ui.toggleMode()
        useToastStore.getState().addToast(`Switched to ${nextMode === 'study' ? 'Study' : 'Personal'} mode`, 'info')
        return
      }

      if (combo === bindings['hyperfocus'] && !inInput) {
        e.preventDefault()
        const ui = useUIStore.getState()
        const wasOn = ui.isHyperFocus
        ui.toggleHyperFocus()
        useToastStore.getState().addToast(wasOn ? 'Exited hyperfocus' : 'Hyperfocus on', 'info')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closePalette, openTaskModal])

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

            {/* Static shortcuts reference */}
            <ShortcutsReference />
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

function ShortcutsReference() {
  const { bindings } = useShortcutsStore()
  return (
    <Command.Group heading="Keyboard Shortcuts">
      {SHORTCUT_IDS.map((id) => (
        <div
          key={id}
          className="flex items-center gap-3 px-3 py-2 mx-1 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span className="flex-1">{SHORTCUT_LABELS[id]}</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {formatCombo(bindings[id])}
          </kbd>
        </div>
      ))}
    </Command.Group>
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
      {!cmd.shortcut && cmd.hint && (
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>{cmd.hint}</span>
      )}
    </Command.Item>
  )
}
