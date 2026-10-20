import { useEffect, useLayoutEffect, useRef } from 'react'
import type * as React from 'react'
import gsap from 'gsap'
import { remoteUpdate } from './remoteUpdate'
import { dragLock } from './dragLock'

/**
 * Элементы внутри контейнера помечаются data-flip-id; data-flip-highlight — подсвечивать после перемещения.
 */
export const FLIP_ATTR = 'data-flip-id'
export const HIGHLIGHT_CLASS = 'remote-moved'

const MOVE_DURATION = 0.45
const ENTER_DURATION = 0.3

interface Snapshot {
  left: number
  top: number
  parentId: string | null
}

function measure(container: HTMLElement) {
  const result = new Map<string, Snapshot>()
  container.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach(el => {
    const rect = el.getBoundingClientRect()
    const parent = el.parentElement?.closest<HTMLElement>(`[${FLIP_ATTR}]`)
    result.set(el.getAttribute(FLIP_ATTR)!, {
      left: rect.left,
      top: rect.top,
      parentId: parent && container.contains(parent) ? parent.getAttribute(FLIP_ATTR) : null,
    })
  })
  return result
}

function highlight(el: HTMLElement) {
  if (!el.hasAttribute('data-flip-highlight')) return
  el.classList.remove(HIGHLIGHT_CLASS)
  // перезапуск CSS-анимации
  void el.offsetWidth
  el.classList.add(HIGHLIGHT_CLASS)
  el.addEventListener('animationend', () => el.classList.remove(HIGHLIGHT_CLASS), { once: true })
}

/**
 * Анимирует переход от снимка before к текущему положению элементов.
 * Возвращает false, если ничего не изменилось (снимок стоит сохранить до следующего рендера).
 */
export function animateFlip(container: HTMLElement, before: Map<string, Snapshot>) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true

  const after = measure(container)
  const elements = new Map<string, HTMLElement>()
  container.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach(el => elements.set(el.getAttribute(FLIP_ATTR)!, el))

  const removed = [...before.keys()].some(id => !after.has(id))
  const deltas = new Map<string, { dx: number; dy: number }>()
  const entered: string[] = []
  const moved: { id: string; dx: number; dy: number; parentChanged: boolean }[] = []

  // Порядок документа: родители обрабатываются раньше детей
  for (const [id, now] of after) {
    const prev = before.get(id)
    if (!prev) {
      entered.push(id)
      continue
    }
    const dx = prev.left - now.left
    const dy = prev.top - now.top
    deltas.set(id, { dx, dy })
    if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
      moved.push({ id, dx, dy, parentChanged: prev.parentId !== now.parentId })
    }
  }

  if (!removed && entered.length === 0 && moved.length === 0) return false

  for (const { id, dx, dy } of moved) {
    const parentId = after.get(id)!.parentId
    const parent = parentId ? deltas.get(parentId) : undefined
    // Родитель тоже анимируется — его смещение уже сдвигает ребёнка
    const ownX = dx - (parent?.dx ?? 0)
    const ownY = dy - (parent?.dy ?? 0)
    if (Math.abs(ownX) < 1 && Math.abs(ownY) < 1) continue

    gsap.fromTo(
      elements.get(id)!,
      { x: ownX, y: ownY },
      { x: 0, y: 0, duration: MOVE_DURATION, ease: 'power2.inOut', clearProps: 'transform' }
    )
  }

  for (const id of entered) {
    gsap.fromTo(
      elements.get(id)!,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: ENTER_DURATION, ease: 'power2.out', clearProps: 'opacity,transform' }
    )
  }

  // Подсвечиваем то, что «перетащили»: новое, перенесённое в другого родителя
  // или при перестановке внутри родителя — сдвинутое дальше всех (остальные лишь уступили место).
  // Одиночный сдвиг внутри родителя — это заполнение освободившегося места, его не подсвечиваем
  const toHighlight = new Set(entered)
  moved.filter(m => m.parentChanged).forEach(m => toHighlight.add(m.id))

  const byParent = new Map<string | null, typeof moved>()
  moved.filter(m => !m.parentChanged).forEach(m => {
    const parentId = after.get(m.id)!.parentId
    byParent.set(parentId, [...(byParent.get(parentId) ?? []), m])
  })
  for (const group of byParent.values()) {
    const distance = (m: typeof moved[number]) => Math.hypot(m.dx, m.dy)
    const sorted = [...group].sort((a, b) => distance(b) - distance(a))
    if (sorted.length > 1 && distance(sorted[0]) - distance(sorted[1]) > 1) toHighlight.add(sorted[0].id)
  }

  toHighlight.forEach(id => highlight(elements.get(id)!))
  return true
}

/**
 * FLIP-анимация изменений, пришедших от других пользователей.
 * Собственные действия (drag-and-drop, оптимистичные обновления) не анимируются.
 */
export function useRemoteFlip(containerRef: React.RefObject<HTMLElement | null>) {
  const snapshot = useRef<Map<string, Snapshot> | null>(null)

  useEffect(() => {
    const offBegin = remoteUpdate.onBegin(() => {
      if (containerRef.current && !dragLock.isActive()) snapshot.current = measure(containerRef.current)
    })
    const offEnd = remoteUpdate.onEnd(() => {
      snapshot.current = null
    })
    return () => {
      offBegin()
      offEnd()
    }
  }, [containerRef])

  useLayoutEffect(() => {
    if (!snapshot.current || !containerRef.current) return
    if (dragLock.isActive()) {
      snapshot.current = null
      return
    }
    if (animateFlip(containerRef.current, snapshot.current)) snapshot.current = null
  })
}
