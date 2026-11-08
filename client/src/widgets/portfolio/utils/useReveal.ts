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

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', root).filter(el => {
      if (revealed.current.has(el)) return false
      if (el.getBoundingClientRect().top < window.innerHeight) {
        revealed.current.add(el)
        return false
      }
      return true
    })
    gsap.set(items, { opacity: 0, y: 16 })

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).map(e => e.target as HTMLElement)
      if (!visible.length) return
      visible.forEach(el => {
        revealed.current.add(el)
        observer.unobserve(el)
      })
      gsap.to(visible, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, clearProps: 'opacity,transform' })
    }, { threshold: 0.1 })

    items.forEach(el => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, ...deps])
}
