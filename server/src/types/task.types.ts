export interface Task {
  id: string

  boardId: string

  columnId: string

  title: string

  content: string

  order: number

  createdAt: string

  updatedAt: string

  deletedAt: string | null
}