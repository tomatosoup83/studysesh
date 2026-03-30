import { Howl } from 'howler'

const sound = new Howl({ src: ['/sounds/alarm.mp3'], volume: 0.7 })

export function playAlarm() {
  sound.play()
}
