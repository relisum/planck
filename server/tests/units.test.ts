import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../src/utils/password'
import { calculateOrder, rebalanceIfNeeded } from '../src/utils/order'

describe('hashPassword / verifyPassword', () => {
  it('проверяет верный пароль и отклоняет неверный', async () => {
    const hash = await hashPassword('correct horse')

    expect(await verifyPassword('correct horse', hash)).toBe(true)
    expect(await verifyPassword('wrong horse', hash)).toBe(false)
  })

  it('использует случайную соль', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'))
  })

  it('не падает на повреждённом хеше', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false)
    expect(await verifyPassword('x', 'bcrypt$aa$bb')).toBe(false)
  })
})

describe('calculateOrder', () => {
  it('считает порядок для пустого списка, начала, конца и середины', () => {
    expect(calculateOrder(undefined, undefined)).toBe(1000)
    expect(calculateOrder(undefined, { order: 1000 })).toBe(500)
    expect(calculateOrder({ order: 1000 }, undefined)).toBe(2000)
    expect(calculateOrder({ order: 1000 }, { order: 2000 })).toBe(1500)
  })
})

describe('rebalanceIfNeeded', () => {
  it('без перебалансировки возвращает порядок между соседями', async () => {
    const items = [{ id: 'a', order: 1000 }, { id: 'b', order: 2000 }, { id: 'c', order: 3000 }]
    const reordered = [items[0], items[2], items[1]]
    const updates: [string, number][] = []

    const result = await rebalanceIfNeeded({
      reordered,
      toIndex: 1,
      moved: items[2],
      updateFn: async (id, order) => { updates.push([id, order]) },
    })

    expect(result).toEqual({ order: 1500, rebalanced: false })
    expect(updates).toEqual([])
  })

  it('перенумеровывает все элементы, если зазор меньше 1', async () => {
    const items = [{ id: 'a', order: 1000 }, { id: 'b', order: 1000.5 }, { id: 'c', order: 1000.75 }]
    const reordered = [items[0], items[2], items[1]]
    const updates: [string, number][] = []

    const result = await rebalanceIfNeeded({
      reordered,
      toIndex: 1,
      moved: items[2],
      updateFn: async (id, order) => { updates.push([id, order]) },
    })

    expect(result).toEqual({ order: 2000, rebalanced: true })
    expect(updates).toEqual([['a', 1000], ['c', 2000], ['b', 3000]])
  })
})
