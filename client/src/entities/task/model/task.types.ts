export interface Task {
  id: string,
  title: string,
  content: string,
  boardId: string,
  status: "todo" | "in_progress" | "done",
  order: number,
  createdAt: Date,
  updatedAt: Date,
}