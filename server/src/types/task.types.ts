export interface Task {
  id: string

  boardId: string

  columnId: string

  taskId: number

  content: string

  order: number

  createdAt: string

  updatedAt: string

  deletedAt: string | null
}