import { type RefObject, useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * true, когда элемент впервые попал в область видимости (дальше не сбрасывается).
 * Элемент может появиться не с первого рендера (компонент ждёт данные), поэтому
 * проверяем ref после каждого рендера. Корень не задаём — IntersectionObserver
 * сам учитывает обрезку скроллящимися предками
 */
export function useInView(ref: RefObject<Element | null>, threshold = 0.3) {
  const [inView, setInView] = useState(false)
  const observed = useRef<Element | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const el = ref.current
    if (inView || !el || el === observed.current) return
    observer.current?.disconnect()
    observed.current = el
    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.current?.disconnect()
      }
    }, { threshold })
    observer.current.observe(el)
  })

  useEffect(() => () => {
    observer.current?.disconnect()
    observed.current = null
  }, [])

  return inView
}
