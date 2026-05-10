import type {Task} from "@/app/types/types.ts";

const tasks: Task[] = [
  { id: '1', title: 'Сделать MVP', description: 'Сделать эту задачу в свое время', status: 'todo', createdAt: '2026-01-02', updatedAt: '2026-01-02' },
  { id: '2', title: 'Сделать графики', description: 'Сделать эту задачу в свое время', status: 'inProgress', createdAt: '2026-01-02', updatedAt: '2026-01-02' },
  { id: '3', title: 'Протестировать Skeleton', description: 'Сделать эту задачу в свое время', status: 'done', createdAt: '2026-01-02', updatedAt: '2026-01-02' },
]

export function fetchTasksMock(): Promise<Task[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(tasks), 2000)
  })
}