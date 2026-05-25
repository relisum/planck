import type {Task} from "@/entities/task";

export interface Column {
  id: string
  boardId: string
  title: string
  order: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  tasks: Task[] | null
}