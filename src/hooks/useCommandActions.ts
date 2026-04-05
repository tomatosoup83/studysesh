import { useMemo } from 'react'
import { Play, Pause, Timer, SkipForward, Music, Sun, Moon, BookOpen, Plus, Zap, Brain, Flower2, StopCircle, PlayCircle } from 'lucide-react'
import { CommandDefinition, COMMAND_CATEGORIES } from '../lib/commands'
import { useTimerStore } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useMusicStore } from '../stores/musicStore'
import { useCommandStore } from '../stores/commandStore'
import { useUIStore } from '../stores/uiStore'
import { useSessionStore } from '../stores/sessionStore'
import { useToastStore } from '../stores/toastStore'
import { useShortcutsStore, formatCombo } from '../stores/shortcutsStore'

export function useCommandActions(onAddTask?: () => void): CommandDefinition[] {
  const timer = useTimerStore()
  const settings = useSettingsStore()
  const music = useMusicStore()
  const cmd = useCommandStore()
  const ui = useUIStore()
  const session = useSessionStore()
  const { addToast } = useToastStore()
  const { bindings } = useShortcutsStore()

  return useMemo<CommandDefinition[]>(() => [
    {
      id: 'timer-toggle',
      label: timer.status === 'running' ? 'Pause Timer' : 'Start Timer',
      category: COMMAND_CATEGORIES.TIMER,
      icon: timer.status === 'running' ? Pause : Play,
      shortcut: formatCombo(bindings['timer-toggle']),
      action: () => {
        const wasRunning = timer.status === 'running'
        wasRunning ? timer.pause() : timer.start()
        addToast(wasRunning ? 'Timer paused' : 'Timer started', 'info')
        cmd.closePalette()
      },
      keywords: ['pomodoro', 'focus'],
    },
    {
      id: 'timer-reset',
      label: 'Reset Timer',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.reset(settings.timerDurations); addToast('Timer reset', 'info'); cmd.closePalette() },
    },
    {
      id: 'timer-focus',
      label: 'Switch to Focus Mode',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('pomodoro', settings.timerDurations); addToast('Switched to Focus', 'info'); cmd.closePalette() },
    },
    {
      id: 'timer-short-break',
      label: 'Switch to Short Break',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('short-break', settings.timerDurations); addToast('Switched to Short Break', 'info'); cmd.closePalette() },
    },
    {
      id: 'timer-long-break',
      label: 'Switch to Long Break',
      category: COMMAND_CATEGORIES.TIMER,
      icon: Timer,
      action: () => { timer.setMode('long-break', settings.timerDurations); addToast('Switched to Long Break', 'info'); cmd.closePalette() },
    },
    {
      id: 'task-add',
      label: 'Add New Task',
      category: COMMAND_CATEGORIES.TASKS,
      icon: Plus,
      shortcut: formatCombo(bindings['task-add']),
      keywords: ['create', 'new', 'todo'],
      action: () => { onAddTask?.(); cmd.closePalette() },
    },
    {
      id: 'music-toggle',
      label: music.lofi.isPlaying ? 'Pause Music' : 'Play Music',
      category: COMMAND_CATEGORIES.MUSIC,
      icon: Music,
      shortcut: formatCombo(bindings['music-toggle']),
      keywords: ['lofi', 'audio', 'youtube'],
      action: () => {
        const wasPlaying = music.lofi.isPlaying
        music.setYouTubePlaying(!wasPlaying)
        addToast(wasPlaying ? 'Music paused' : 'Music playing', 'info')
        cmd.closePalette()
      },
    },
    {
      id: 'music-next',
      label: 'Next Track',
      category: COMMAND_CATEGORIES.MUSIC,
      icon: SkipForward,
      action: () => { music.nextTrack(); addToast('Next track', 'info'); cmd.closePalette() },
    },
    {
      id: 'session-toggle',
      label: session.isActive ? 'End Session' : 'Start Session',
      category: COMMAND_CATEGORIES.SESSION,
      icon: session.isActive ? StopCircle : PlayCircle,
      shortcut: formatCombo(bindings['session-toggle']),
      keywords: ['session', 'start', 'end', 'stop'],
      action: () => {
        if (session.isActive) { session.endSession(); addToast('Session ended', 'info') }
        else { session.startSession(); addToast('Session started', 'success') }
        cmd.closePalette()
      },
    },
    {
      id: 'ui-hyperfocus',
      label: ui.isHyperFocus ? 'Exit Hyper Focus' : 'Hyper Focus Mode',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Zap,
      shortcut: formatCombo(bindings['hyperfocus']),
      keywords: ['focus', 'zen', 'distraction', 'hide'],
      action: () => {
        const wasOn = ui.isHyperFocus
        ui.toggleHyperFocus()
        addToast(wasOn ? 'Exited hyperfocus' : 'Hyperfocus on', 'info')
        cmd.closePalette()
      },
    },
    {
      id: 'mode-toggle',
      label: `Switch to ${ui.mode === 'study' ? 'Personal' : 'Study'} Mode`,
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: ui.mode === 'study' ? Flower2 : Brain,
      shortcut: formatCombo(bindings['mode-toggle']),
      keywords: ['mode', 'personal', 'study', 'switch'],
      action: () => {
        const nextMode = ui.mode === 'study' ? 'personal' : 'study'
        ui.toggleMode()
        addToast(`Switched to ${nextMode === 'study' ? 'Study' : 'Personal'} mode`, 'info')
        cmd.closePalette()
      },
    },
    {
      id: 'theme-dark',
      label: 'Dark Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Moon,
      action: () => { settings.setTheme('dark'); addToast('Dark theme applied', 'success'); cmd.closePalette() },
    },
    {
      id: 'theme-light',
      label: 'Light Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Sun,
      action: () => { settings.setTheme('light'); addToast('Light theme applied', 'success'); cmd.closePalette() },
    },
    {
      id: 'theme-paper',
      label: 'Paper Theme',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: BookOpen,
      action: () => { settings.setTheme('paper'); addToast('Paper theme applied', 'success'); cmd.closePalette() },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [timer.status, music.lofi.isPlaying, ui.isHyperFocus, ui.mode, session.isActive, bindings])
}
