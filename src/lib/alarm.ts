import { Howl } from 'howler'
import { useSettingsStore } from '../stores/settingsStore'

let currentSound: Howl | null = null
let stopTimeout: ReturnType<typeof setTimeout> | null = null

export function playAlarm() {
  const { alarmSoundBase64, alarmDurationSecs } = useSettingsStore.getState()

  // Stop any currently playing alarm
  if (currentSound) {
    currentSound.stop()
    currentSound.unload()
    currentSound = null
  }
  if (stopTimeout) {
    clearTimeout(stopTimeout)
    stopTimeout = null
  }

  const src = alarmSoundBase64 ?? '/sounds/alarm.mp3'
  const format: string[] = alarmSoundBase64 ? ['mp3', 'wav', 'ogg', 'webm'] : ['mp3']
  currentSound = new Howl({ src: [src], volume: 0.7, format })
  currentSound.play()

  stopTimeout = setTimeout(() => {
    currentSound?.stop()
    currentSound?.unload()
    currentSound = null
    stopTimeout = null
  }, alarmDurationSecs * 1000)
}
