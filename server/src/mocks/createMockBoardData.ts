import { createMockBoard } from './boards.mock'
import { createMockColumn } from './columns.mock'
import { createMockTask } from './tasks.mock'

export function createMockBoardData() {
  const board = createMockBoard()

  const columns = [
    createMockColumn({
      boardId: board.id,
      title: 'Todo',
      order: board.order,
    }),

    createMockColumn({
      boardId: board.id,
      title: 'In Progress',
      order: board.order,
    }),

    createMockColumn({
      boardId: board.id,
      title: 'Done',
      order: board.order,
    }),
  ]

  const tasks = columns.flatMap((column, columnIndex) =>
    Array.from({ length: 5 }, (_, index) =>
      createMockTask({
        boardId: board.id,

        columnId: column.id,

        order: (index + 1) * 1000,

        title: `Task ${columnIndex + 1}-${index + 1}`,
      })
    )
  )

  return {
    board,
    columns,
    tasks,
  }
}