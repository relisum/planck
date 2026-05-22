export interface Column {
  id: string
  boardId: string
  title: string
  order: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}