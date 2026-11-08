import { useLayoutEffect, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

function getInitial(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* localStorage недоступен — берём системную тему */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Общее состояние темы: переключатель и, например, командная палитра видят одно значение
let theme: Theme = getInitial()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark'
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* не сохраняем */ }
  listeners.forEach(listener => listener())
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => theme)

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', current)
  }, [current])

  return { isDark: current === 'dark', toggle: toggleTheme }
}
