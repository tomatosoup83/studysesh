import { TimerMode } from '../types/timer'

export function getNextMode(
  currentMode: TimerMode,
  pomodorosCompleted: number,
  longBreakInterval: number
): TimerMode {
  if (currentMode === 'pomodoro') {
    return (pomodorosCompleted + 1) % longBreakInterval === 0 ? 'long-break' : 'short-break'
  }
  return 'pomodoro'
}

export function getModeLabel(mode: TimerMode): string {
  return mode === 'pomodoro' ? 'Focus' : mode === 'short-break' ? 'Short Break' : 'Long Break'
}

export function getModeColor(mode: TimerMode): string {
  return mode === 'pomodoro' ? 'var(--color-primary)' : mode === 'short-break' ? 'var(--color-success)' : 'var(--color-accent)'
}
