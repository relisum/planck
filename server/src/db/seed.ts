import { prisma } from './client'
import { createMockBoards } from '../mocks/boards.mock'
import { createMockTasks } from '../mocks/tasks.mock'

export async function seedDb(): Promise<void> {
  const boardCount = await prisma.board.count()

  if (boardCount > 0) {
    console.log(`ℹ️  DB already has boards, skipping seed`)
    return
  }

  const boards = createMockBoards(7)

  await prisma.board.createMany({
    data: boards.map(board => ({
      id:        board.id,
      title:     board.title,
      color:     board.color,
      // taskCount: board.taskCount,
      createdAt: new Date(board.createdAt),
      active:    board.active,
    }))
  })

  const tasks = boards.flatMap(board => createMockTasks(board.id, 5))

  await prisma.task.createMany({
    data: tasks.map(task => ({
      id:        task.id,
      title:     task.title,
      content:   task.content,
      status:    task.status,
      order:     task.order,
      boardId:   task.boardId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      active:    task.active,
    }))
  })

  console.log(`🌱 Seeded ${boards.length} boards, ${tasks.length} tasks`)
}