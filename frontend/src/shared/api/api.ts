import type { Task } from '@/app/types/types.ts'

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks/')

  if (!res.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return res.json()
}