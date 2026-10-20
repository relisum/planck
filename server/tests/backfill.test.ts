import { describe, expect, it } from 'vitest'
import { prisma, backfillBoardOwners } from '../src/db/client'
import { uniqueName } from './helpers'

describe('backfillBoardOwners', () => {
  it('делает владельца участником старых досок и не дублирует записи', async () => {
    const user = await prisma.user.create({ data: { username: uniqueName('legacy'), displayName: 'Legacy' } })
    // Доска в состоянии «до миграции» — без записи в board_members
    const board = await prisma.board.create({
      data: { userId: user.id, title: 'Old board', color: '#378ADD', order: 3000 },
    })

    expect(await backfillBoardOwners()).toBeGreaterThanOrEqual(1)
    expect(await backfillBoardOwners()).toBe(0)

    const members = await prisma.boardMember.findMany({ where: { boardId: board.id } })
    expect(members).toEqual([
      expect.objectContaining({ userId: user.id, role: 'owner', order: 3000 }),
    ])
  })
})
