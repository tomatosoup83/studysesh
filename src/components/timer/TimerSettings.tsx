import { useState } from 'react'
import { Settings } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTimerStore } from '../../stores/timerStore'
import { Modal } from '../ui/Modal'
import { Slider } from '../ui/Slider'

export function TimerSettings() {
  const [open, setOpen] = useState(false)
  const { timerDurations, setTimerDuration, autoStartBreaks, setAutoStartBreaks, longBreakInterval, setLongBreakInterval, notificationsEnabled, setNotificationsEnabled } = useSettingsStore()
  const { reset, status } = useTimerStore()

  const handleClose = () => { setOpen(false); if (status !== 'running') reset(timerDurations) }

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }} title="Timer settings">
        <Settings size={13} />
      </button>
      <Modal open={open} onClose={handleClose} title="Timer Settings" size="sm">
        <div className="space-y-4">
          {([
            { label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 90 * 60 },
            { label: 'Short Break', key: 'shortBreak' as const, min: 60, max: 30 * 60 },
            { label: 'Long Break', key: 'longBreak' as const, min: 5 * 60, max: 45 * 60 },
          ] as const).map(({ label, key, min, max }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={min / 60}
                    max={max / 60}
                    value={timerDurations[key] / 60}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v * 60 >= min && v * 60 <= max) setTimerDuration(key, v * 60)
                    }}
                    className="w-12 px-1.5 py-0.5 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <span style={{ color: 'var(--color-text-muted)' }}>min</span>
                </div>
              </div>
              <Slider value={timerDurations[key]} onChange={(v) => setTimerDuration(key, v)} min={min} max={max} step={60} />
            </div>
          ))}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--color-text-secondary)' }}>Long break every</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{longBreakInterval} pomodoros</span>
            </div>
            <Slider value={longBreakInterval} onChange={setLongBreakInterval} min={2} max={8} />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={autoStartBreaks} onChange={(e) => setAutoStartBreaks(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Auto-start breaks</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Desktop notifications</span>
          </label>
        </div>
      </Modal>
    </>
  )
}
