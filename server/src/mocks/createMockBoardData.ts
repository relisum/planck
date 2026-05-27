import { createMockBoard } from './boards.mock'
import { createMockColumn } from './columns.mock'
import { createMockTask } from './tasks.mock'
import {createMockSubTask} from "./subtasks.mocks";

export function createMockBoardData() {
  const board = createMockBoard()

  const columns = [
    createMockColumn({ boardId: board.id, title: 'Todo', order: 1000 }),
    createMockColumn({ boardId: board.id, title: 'In Progress', order: 2000 }),
    createMockColumn({ boardId: board.id, title: 'Done', order: 3000 }),
    createMockColumn({ boardId: board.id, title: 'Todo', order: 4000 }),
  ]

  const tasks = columns.flatMap(column =>
    Array.from({ length: 3 }, (_, index) =>
      createMockTask({
        boardId: board.id,
        columnId: column.id,
        order: (index + 1) * 1000,
        taskId: index + 1,
      })
    )
  )

  const subtasks = tasks.flatMap(task =>
    Array.from({ length: 4 }, (_, index) =>
      createMockSubTask({
        taskId: task.id,
        order: (index + 1) * 1000,
      })
    )
  )

  return {
    board,
    columns,
    tasks,
    subtasks,
  }
}