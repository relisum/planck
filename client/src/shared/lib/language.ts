import i18n from 'i18next'

export const LANG_KEY = 'lang'
export const LANGUAGES = ['ru', 'en'] as const
export type Language = typeof LANGUAGES[number]

export function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'ru' || stored === 'en') return stored
  } catch { /* localStorage недоступен */ }
  return null
}

// Ручной выбор языка запоминается; язык по браузеру — нет
export function setLanguage(lng: Language) {
  try { localStorage.setItem(LANG_KEY, lng) } catch { /* не сохраняем */ }
  return i18n.changeLanguage(lng)
}
