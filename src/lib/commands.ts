import { LucideIcon } from 'lucide-react'

export interface CommandDefinition {
  id: string
  label: string
  category: string
  hint?: string
  shortcut?: string
  icon?: LucideIcon
  action: () => void
  keywords?: string[]
}

export const COMMAND_CATEGORIES = {
  TASKS: 'Tasks',
  TIMER: 'Timer',
  MUSIC: 'Music',
  SESSION: 'Session',
  SETTINGS: 'Settings',
} as const
