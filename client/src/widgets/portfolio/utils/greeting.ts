import { EMAIL } from '../model/resume'

let greeted = false

// Пасхалка для тех, кто открыл DevTools
export function greetInConsole() {
  if (greeted) return
  greeted = true
  console.log(
    '%cПривет, коллега 👋%c\nСмотришь исходники? Мне это нравится.\nКод: https://github.com/relisum/planck · Почта: ' + EMAIL + '\nПодсказка: ↑ ↑ ↓ ↓ ← → ← → B A',
    'font: 600 16px sans-serif; color: #2563eb',
    'font: 13px sans-serif; line-height: 1.6',
  )
}
