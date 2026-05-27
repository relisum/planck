export interface Subtask {
  id: string

  taskId: string

  done: boolean

  content: string

  order: number

  deletedAt: string | null
}