import {createMockBoardData} from "../src/mocks/createMockBoardData";
import {prisma} from "../src/db/client";

(async () => {
  console.log('🌱 Seeding database...')

  for (let i = 0; i < 5; i++) {
    const data = createMockBoardData()

    await prisma.$transaction([
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
})()