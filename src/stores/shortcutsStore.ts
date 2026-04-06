import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ShortcutId =
  | 'palette-open'
  | 'task-add'
  | 'timer-toggle'
  | 'music-toggle'
  | 'session-toggle'
  | 'mode-toggle'
  | 'hyperfocus'
  | 'budget-transaction-add'

export const SHORTCUT_LABELS: Record<ShortcutId, string> = {
  'palette-open': 'Open command palette',
  'task-add': 'Add new task',
  'timer-toggle': 'Start / pause timer',
  'music-toggle': 'Play / pause music',
  'session-toggle': 'Start / end session',
  'mode-toggle': 'Switch study / personal mode',
  'hyperfocus': 'Toggle hyperfocus',
  'budget-transaction-add': 'Add transaction (Budget)',
}

export const DEFAULT_BINDINGS: Record<ShortcutId, string> = {
  'palette-open': 'meta+k',
  'task-add': 'meta+a',
  'timer-toggle': 'meta+enter',
  'music-toggle': 'meta+shift+p',
  'session-toggle': 'meta+shift+s',
  'mode-toggle': 'meta+shift+l',
  'hyperfocus': 'meta+shift+space',
  'budget-transaction-add': 'meta+a',
}

// All shortcut IDs in display order
export const SHORTCUT_IDS: ShortcutId[] = [
  'palette-open',
  'task-add',
  'timer-toggle',
  'music-toggle',
  'session-toggle',
  'mode-toggle',
  'hyperfocus',
  'budget-transaction-add',
]

interface ShortcutsStore {
  bindings: Record<ShortcutId, string>
  setBinding: (id: ShortcutId, combo: string) => void
  resetToDefaults: () => void
}

export const useShortcutsStore = create<ShortcutsStore>()(
  persist(
    (set) => ({
      bindings: { ...DEFAULT_BINDINGS },

      setBinding: (id, combo) =>
        set((s) => {
          const newBindings = { ...s.bindings }
          // If the combo is already assigned to another shortcut, clear it there first
          for (const k of Object.keys(newBindings) as ShortcutId[]) {
            if (k !== id && newBindings[k] === combo) newBindings[k] = ''
          }
          newBindings[id] = combo
          return { bindings: newBindings }
        }),

      resetToDefaults: () => set({ bindings: { ...DEFAULT_BINDINGS } }),
    }),
    { name: 'studysesh-shortcuts' }
  )
)

// Parse a KeyboardEvent into a canonical combo string like "meta+shift+p"
export function getKeyCombo(e: KeyboardEvent): string {
  const mods: string[] = []
  if (e.metaKey || e.ctrlKey) mods.push('meta')
  if (e.shiftKey) mods.push('shift')
  if (e.altKey) mods.push('alt')

  let key = e.key
  if (key === ' ') key = 'space'
  else if (['Meta', 'Control', 'Shift', 'Alt'].includes(key)) return ''
  else key = key.toLowerCase()

  if (!key) return ''
  return [...mods, key].join('+')
}

// Format a combo string like "meta+shift+p" into a display string like "⌘⇧P"
export function formatCombo(combo: string): string {
  if (!combo) return '—'
  return combo
    .split('+')
    .map((part) => {
      switch (part) {
        case 'meta': return '⌘'
        case 'shift': return '⇧'
        case 'alt': return '⌥'
        case 'enter': return '↩'
        case 'space': return 'Space'
        case 'escape': return 'Esc'
        case 'backspace': return '⌫'
        default: return part.toUpperCase()
      }
    })
    .join('')
}
