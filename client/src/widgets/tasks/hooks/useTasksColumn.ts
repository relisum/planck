import { taskApi } from '@/entities/task/api/task.api'
import { useDragTasks } from '@/features/tasks/hooks/useDragTasks'

export function useTasksColumn(boardId: string) {
  const { data, isLoading } = taskApi.useGetByBoardId(boardId)
  const { tasks, handleDragEnd } = useDragTasks(boardId, data ?? [])

  return { tasks, isLoading, handleDragEnd }
}