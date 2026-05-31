import { useEffect, useRef, useState } from 'react'

export function useRecoverTimer(
  duration: number,
  onExpire: () => void,
  circumference: number,
  resetKey?: string | null,
) {
  const [remaining, setRemaining] = useState(duration)
  const [offset, setOffset] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRemaining(duration)

    setOffset(0)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset(circumference)
      })
    })

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [resetKey])

  useEffect(() => {
    if (remaining === 0) {
      onExpire()
    }
  }, [remaining, onExpire])

  return {remaining, offset}
}