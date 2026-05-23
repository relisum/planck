import { useEffect, useRef, useState } from 'react'


export function useRecoverTimer(duration: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current!)
  }, [])

  useEffect(() => {
    if (remaining === 0) {
      const timeout = setTimeout(() => onExpire(), 1000)
      return () => clearTimeout(timeout)
    }
  }, [remaining])

  return remaining
}