import { createMockBoard } from './boards.mock'
import { createMockColumn } from './columns.mock'
import { createMockTask } from './tasks.mock'

export function createMockBoardData() {
  const board = createMockBoard()

  const columns = [
    createMockColumn({ boardId: board.id, title: 'Todo', order: 1000 }),
    createMockColumn({ boardId: board.id, title: 'In Progress', order: 2000 }),
    createMockColumn({ boardId: board.id, title: 'Done', order: 3000 }),
  ]

  const tasks = columns.flatMap((column, columnIndex) =>
    Array.from({ length: 5 }, (_, index) =>
      createMockTask({
        boardId: board.id,

        columnId: column.id,

        order: (index + 1) * 1000,

        taskId: index + 1,
      })
    )
  )

  return {
    board,
    columns,
    tasks,
  }
}