import { useEffect, useRef } from 'react'

const SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

// ↑↑↓↓←→←→BA — пасхалка; ввод в полях форм не считается
export function useKonami(onMatch: () => void) {
  const position = useRef(0)
  const callback = useRef(onMatch)
  callback.current = onMatch

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === SEQUENCE[position.current]) {
        position.current++
        if (position.current === SEQUENCE.length) {
          position.current = 0
          callback.current()
        }
      } else {
        position.current = key === SEQUENCE[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
