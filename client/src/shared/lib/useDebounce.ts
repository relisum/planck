import { useRef } from 'react'


export function useDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number | 500
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (...args: T) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }
}