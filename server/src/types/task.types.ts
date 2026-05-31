export interface Task {
  id: string
  boardId: string
  columnId: string
  taskId: number
  content: string
  order: number
  priority: "high" | "medium" | "low" | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}