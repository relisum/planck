export interface Subtask {
  id: string
  taskId: string
  order: number
  content: string
  done: boolean
}

export interface Task {
  id: string,
  taskId: number,
  content: string,
  subtasks: Subtask[],
  columnId: string,
  boardId: string,
  order: number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null,
}