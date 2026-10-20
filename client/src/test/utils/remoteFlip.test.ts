import { describe, it, expect, beforeEach, vi } from 'vitest'
import gsap from 'gsap'
import { animateFlip, FLIP_ATTR, HIGHLIGHT_CLASS } from '@/shared/lib/useRemoteFlip'

type Rect = { left: number; top: number }

/**
 * Строит DOM вида колонка → карточки и задаёт элементам позиции для getBoundingClientRect
 */
function setPositions(container: HTMLElement, positions: Record<string, Rect>) {
  container.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach(el => {
    const { left, top } = positions[el.getAttribute(FLIP_ATTR)!] ?? { left: 0, top: 0 }
    el.getBoundingClientRect = () => ({ left, top, x: left, y: top, width: 100, height: 40, right: left + 100, bottom: top + 40, toJSON: () => ({}) })
  })
}

function snapshot(container: HTMLElement, positions: Record<string, Rect>) {
  setPositions(container, positions)
  const map = new Map<string, { left: number; top: number; parentId: string | null }>()
  container.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach(el => {
    const parent = el.parentElement?.closest(`[${FLIP_ATTR}]`)
    map.set(el.getAttribute(FLIP_ATTR)!, { ...positions[el.getAttribute(FLIP_ATTR)!], parentId: parent?.getAttribute(FLIP_ATTR) ?? null })
  })
  return map
}

function board(columns: Record<string, string[]>) {
  const container = document.createElement('div')
  container.innerHTML = Object.entries(columns).map(([column, tasks]) =>
    `<div ${FLIP_ATTR}="${column}">${tasks.map(t => `<div ${FLIP_ATTR}="${t}" data-flip-highlight></div>`).join('')}</div>`
  ).join('')
  return container
}

const highlighted = (container: HTMLElement) =>
  [...container.querySelectorAll(`.${HIGHLIGHT_CLASS}`)].map(el => el.getAttribute(FLIP_ATTR))

let fromTo: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  fromTo = vi.spyOn(gsap, 'fromTo').mockReturnValue({} as gsap.core.Tween)
})

const animatedFrom = (id: string, container: HTMLElement) =>
  fromTo.mock.calls.find((call: unknown[]) => call[0] === container.querySelector(`[${FLIP_ATTR}="${id}"]`))?.[1]

describe('animateFlip', () => {
  it('ничего не делает и сохраняет снимок, если позиции не изменились', () => {
    const container = board({ c1: ['t1', 't2'] })
    const positions = { c1: { left: 0, top: 0 }, t1: { left: 0, top: 50 }, t2: { left: 0, top: 100 } }
    const before = snapshot(container, positions)

    expect(animateFlip(container, before)).toBe(false)
    expect(fromTo).not.toHaveBeenCalled()
  })

  it('карточка, перенесённая в другую колонку, едет со старого места и подсвечивается', () => {
    const before = snapshot(board({ c1: ['t1', 't2'], c2: [] }), {
      c1: { left: 0, top: 0 }, c2: { left: 300, top: 0 },
      t1: { left: 0, top: 50 }, t2: { left: 0, top: 100 },
    })

    const after = board({ c1: ['t2'], c2: ['t1'] })
    setPositions(after, {
      c1: { left: 0, top: 0 }, c2: { left: 300, top: 0 },
      t1: { left: 300, top: 50 }, t2: { left: 0, top: 50 },
    })

    expect(animateFlip(after, before)).toBe(true)
    expect(animatedFrom('t1', after)).toEqual({ x: -300, y: 0 })
    expect(animatedFrom('t2', after)).toEqual({ x: 0, y: 50 })
    expect(highlighted(after)).toEqual(['t1'])
  })

  it('при перестановке внутри колонки подсвечивает только перенесённую карточку', () => {
    const container = board({ c1: ['t1', 't2', 't3'] })
    const before = snapshot(container, {
      c1: { left: 0, top: 0 }, t1: { left: 0, top: 50 }, t2: { left: 0, top: 100 }, t3: { left: 0, top: 150 },
    })

    // t3 переехала наверх: t1 и t2 сдвинулись на одну позицию, t3 — на две
    setPositions(container, {
      c1: { left: 0, top: 0 }, t3: { left: 0, top: 50 }, t1: { left: 0, top: 100 }, t2: { left: 0, top: 150 },
    })

    animateFlip(container, before)

    expect(animatedFrom('t3', container)).toEqual({ x: 0, y: 100 })
    expect(highlighted(container)).toEqual(['t3'])
  })

  it('при перемещении колонки не анимирует карточки повторно', () => {
    const container = board({ c1: ['t1'], c2: ['t2'] })
    const before = snapshot(container, {
      c1: { left: 0, top: 0 }, c2: { left: 300, top: 0 }, t1: { left: 0, top: 50 }, t2: { left: 300, top: 50 },
    })

    setPositions(container, {
      c1: { left: 300, top: 0 }, c2: { left: 0, top: 0 }, t1: { left: 300, top: 50 }, t2: { left: 0, top: 50 },
    })

    animateFlip(container, before)

    expect(animatedFrom('c1', container)).toEqual({ x: -300, y: 0 })
    expect(animatedFrom('c2', container)).toEqual({ x: 300, y: 0 })
    expect(animatedFrom('t1', container)).toBeUndefined()
    expect(animatedFrom('t2', container)).toBeUndefined()
  })

  it('новые элементы проявляются и подсвечиваются', () => {
    const before = snapshot(board({ c1: ['t1'] }), { c1: { left: 0, top: 0 }, t1: { left: 0, top: 50 } })

    const after = board({ c1: ['t1', 't-new'] })
    setPositions(after, { c1: { left: 0, top: 0 }, t1: { left: 0, top: 50 }, 't-new': { left: 0, top: 100 } })

    expect(animateFlip(after, before)).toBe(true)
    expect(animatedFrom('t-new', after)).toEqual({ opacity: 0, scale: 0.96 })
    expect(highlighted(after)).toEqual(['t-new'])
  })

  it('удаление элемента считается изменением', () => {
    const before = snapshot(board({ c1: ['t1', 't2'] }), { c1: { left: 0, top: 0 }, t1: { left: 0, top: 50 }, t2: { left: 0, top: 100 } })

    const after = board({ c1: ['t2'] })
    setPositions(after, { c1: { left: 0, top: 0 }, t2: { left: 0, top: 50 } })

    expect(animateFlip(after, before)).toBe(true)
    expect(animatedFrom('t2', after)).toEqual({ x: 0, y: 50 })
  })
})
