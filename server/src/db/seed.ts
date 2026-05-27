import { prisma } from './client'

import { createMockBoardData } from '../mocks/createMockBoardData'

export async function seedDb() {
  const boardsCount = await prisma.board.count()

  /**
   * Уже засидено
   */
  if (boardsCount > 0) {
    console.log('🌱 Database already seeded')

    return
  }

  console.log('🌱 Seeding database...')

  /**
   * Создаем несколько boards
   */
  for (let i = 0; i < 5; i++) {
    const data = createMockBoardData()

    await prisma.$transaction([
      /**
       * Board
       */
      prisma.board.create({
        data: {
          id: data.board.id,

          title: data.board.title,

          color: data.board.color,

          order: data.board.order,

          createdAt: new Date(data.board.createdAt),

          updatedAt: new Date(data.board.updatedAt),
        },
      }),

      /**
       * Columns
       */
      prisma.column.createMany({
        data: data.columns.map((column) => ({
          id: column.id,

          boardId: column.boardId,

          title: column.title,

          order: column.order,

          createdAt: new Date(column.createdAt),

          updatedAt: new Date(column.updatedAt),
        })),
      }),

      /**
       * Tasks
       */
      prisma.task.createMany({
        data: data.tasks.map((task) => ({
          id: task.id,

          boardId: task.boardId,

          columnId: task.columnId,

          taskId: task.taskId,

          content: task.content,

          order: task.order,

          createdAt: new Date(task.createdAt),

          updatedAt: new Date(task.updatedAt),
        })),
      }),

      /**
       * Subtasks
       */

      prisma.subtasks.createMany({
        data: data.subtasks.map((subtask) => ({
          id: subtask.id,
          taskId: subtask.taskId,
          order: subtask.order,
          done: subtask.done,
          content: subtask.content,
        }))
      })
    ])
  }

  console.log('✅ Database seeded')
}