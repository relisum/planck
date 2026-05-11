import { prisma } from './client'
import { createMockBoards } from '../mocks/boards.mock'

export async function seedDb(): Promise<void> {
  const count = await prisma.board.count()

  if (count > 0) {
    console.log(`ℹ️  DB already has ${count} boards, skipping seed`)
    return
  }

  const boards = createMockBoards(7)

  // createMany — вставляет все записи одним запросом
  await prisma.board.createMany({
    data: boards.map(board => ({
      id:        board.id,
      title:     board.title,
      color:     board.color,
      taskCount: board.taskCount,
      createdAt: new Date(board.createdAt),
      active:    board.active
    }))
  })

  console.log(`🌱 Seeded ${boards.length} boards`)
}