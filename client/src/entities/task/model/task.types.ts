export interface Task {
  id: string,
  taskId: number,
  content: string,
  columnId: string,
  boardId: string,
  // status: "todo" | "in_progress" | "done",
  order: number,
  createdAt: Date,
  updatedAt: Date,
}