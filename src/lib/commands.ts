import { LucideIcon } from 'lucide-react'

export interface CommandDefinition {
  id: string
  label: string
  category: string
  hint?: string
  icon?: LucideIcon
  action: () => void
  keywords?: string[]
}

export const COMMAND_CATEGORIES = {
  TASKS: 'Tasks',
  TIMER: 'Timer',
  MUSIC: 'Music',
  SETTINGS: 'Settings',
} as const
