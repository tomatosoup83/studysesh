import { useMemo } from 'react'
import { Play, Pause, Timer, SkipForward, Music, Sun, Moon, BookOpen, Plus, Zap } from 'lucide-react'
import { CommandDefinition, COMMAND_CATEGORIES } from '../lib/commands'
import { useTimerStore } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useMusicStore } from '../stores/musicStore'
import { useCommandStore } from '../stores/commandStore'
import { useUIStore } from '../stores/uiStore'

export function useCommandActions(onAddTask?: () => void): CommandDefinition[] {
  const timer = useTimerStore()
  const settings = useSettingsStore()
  const music = useMusicStore()
  const cmd = useCommandStore()
  const ui = useUIStore()

  return useMemo<CommandDefinition[]>(() => [
    {
      id: 'timer-toggle',
      label: timer.status === 'running' ? 'Pause Timer' : 'Start Timer',
      category: COMMAND_CATEGORIES.TIMER,
      icon: timer.status === 'running' ? Pause : Play,
      action: () => { timer.status === 'running' ? timer.pause() : timer.start(); cmd.closePalette() },
      keywords: ['pomodoro', 'focus'],
    },
    {
      id: 'timer-reset',
      label: 'Reset Timer',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.reset(settings.timerDurations); cmd.closePalette() },
    },
    {
      id: 'timer-focus',
      label: 'Switch to Focus Mode',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('pomodoro', settings.timerDurations); cmd.closePalette() },
    },
    {
      id: 'timer-short-break',
      label: 'Switch to Short Break',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('short-break', settings.timerDurations); cmd.closePalette() },
    },
    {
      id: 'timer-long-break',
      label: 'Switch to Long Break',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('long-break', settings.timerDurations); cmd.closePalette() },
    },
    {
      id: 'task-add',
      label: 'Add New Task',
      category: COMMAND_CATEGORIES.TASKS,
      icon: Plus,
      keywords: ['create', 'new', 'todo'],
      action: () => { onAddTask?.(); cmd.closePalette() },
    },
    {
      id: 'music-toggle',
      label: music.lofi.isPlaying ? 'Pause Music' : 'Play Music',
      category: COMMAND_CATEGORIES.MUSIC,
      icon: Music,
      keywords: ['lofi', 'audio', 'youtube'],
      action: () => { music.setYouTubePlaying(!music.lofi.isPlaying); cmd.closePalette() },
    },
    {
      id: 'music-next',
      label: 'Next Track',
      category: COMMAND_CATEGORIES.MUSIC,
      icon: SkipForward,
      action: () => { music.nextTrack(); cmd.closePalette() },
    },
    {
      id: 'ui-hyperfocus',
      label: ui.isHyperFocus ? 'Exit Hyper Focus' : 'Hyper Focus Mode',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Zap,
      keywords: ['focus', 'zen', 'distraction', 'hide'],
      action: () => { ui.toggleHyperFocus(); cmd.closePalette() },
    },
    {
      id: 'theme-dark',
      label: 'Dark Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Moon,
      action: () => { settings.setTheme('dark'); cmd.closePalette() },
    },
    {
      id: 'theme-light',
      label: 'Light Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Sun,
      action: () => { settings.setTheme('light'); cmd.closePalette() },
    },
    {
      id: 'theme-paper',
      label: 'Paper Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: BookOpen,
      action: () => { settings.setTheme('paper'); cmd.closePalette() },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [timer.status, music.lofi.isPlaying, ui.isHyperFocus])
}
