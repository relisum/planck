export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(navigator.language.startsWith('ru') ? 'ru-RU' : 'eu-EU', {})
}