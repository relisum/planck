import { type RefObject, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './useInView'

/**
 * Блоки с [data-reveal] мягко поднимаются, когда доходят до экрана.
 * Видимое на первом экране не прячем: невидимый текст не засчитывается в LCP, и страница казалась бы медленнее.
 * Перезапускается при смене deps, чтобы подхватить блоки, появившиеся после загрузки данных
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  const revealed = useRef(new WeakSet<Element>())
  const hidden = useRef(new WeakSet<Element>())

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const show = (els: HTMLElement[]) => {
      if (els.length) gsap.to(els, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, clearProps: 'opacity,transform' })
    }

    // Уже на экране: если блок прятали на прошлом запуске (перезапуск пришёлся на прокрутку) — проявляем,
    // иначе оставляем как есть
    const inViewport: HTMLElement[] = []
    const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', root).filter(el => {
      if (revealed.current.has(el)) return false
      if (el.getBoundingClientRect().top < window.innerHeight) {
        revealed.current.add(el)
        if (hidden.current.has(el)) inViewport.push(el)
        return false
      }
      return true
    })
    show(inViewport)
    gsap.set(items, { opacity: 0, y: 16 })
    items.forEach(el => hidden.current.add(el))

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).map(e => e.target as HTMLElement)
      if (!visible.length) return
      visible.forEach(el => {
        revealed.current.add(el)
        observer.unobserve(el)
      })
      show(visible)
    }, { threshold: 0.1 })

    items.forEach(el => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, ...deps])
}
