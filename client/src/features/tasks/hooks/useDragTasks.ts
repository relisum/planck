import {useState, useCallback, useEffect} from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { taskApi } from '@/entities/task/api/task.api'
import { useDebounce } from '@/shared/lib/useDebounce'
import type { Task } from '@/entities/task'

export function useDragTasks(boardId: string, initialTasks: Task[]) {
  const queryClient = useQueryClient()
  const [tasks, setTasks] = useState(initialTasks)

  const { mutate } = useMutation(
    ({ id, order }: { id: string; order: number }) => taskApi.reorder(id, order)
  )

  const debouncedSave = useDebounce(async (reorderedTasks: Task[]) => {
    reorderedTasks.forEach((task, index) => {
      if (task.order !== index) {
        mutate({ id: task.id, order: index })
      }
    })
    await queryClient.invalidateQueries(['tasks', boardId])
  }, 600)

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    setTasks(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      const reordered = updated.map((t, i) => ({ ...t, order: i }))
      debouncedSave(reordered)
      return reordered
    })
  }, [debouncedSave])

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks.length, initialTasks[0]?.id])

  return { tasks, handleDragEnd }
}