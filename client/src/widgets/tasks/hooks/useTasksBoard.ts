import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { taskApi } from '@/entities/task/api/task.api'
import { useDebounce } from '@/shared/lib/useDebounce'
import type { Task } from '@/entities/task'

type TasksByStatus = Record<string, Task[]>

const STATUSES = ['todo', 'in_progress', 'done']

function groupByStatus(tasks: Task[]): TasksByStatus {
  const initial = STATUSES.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as TasksByStatus)
  return tasks.reduce((acc, task) => {
    acc[task.status] = [...(acc[task.status] ?? []), task]
    return acc
  }, initial)
}

export function useTasksBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data } = taskApi.useGetByBoardId(boardId)

  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>(
    STATUSES.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as TasksByStatus)
  )
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [sourceColumn, setSourceColumn] = useState<string | null>(null)

  useEffect(() => {
    if (data?.length) setTasksByStatus(groupByStatus(data))
  }, [data?.length, data?.[0]?.id])

  const { mutate } = useMutation(
    ({ id, status, order }: { id: string; status: "todo" | "in_progress" | "done"; order: number }) =>
      taskApi.update(id, { status, order })
  )

  const debouncedSave = useDebounce(async (tasks: Task[]) => {
    tasks.forEach(task => mutate({ id: task.id, status: task.status, order: task.order }))
    await queryClient.invalidateQueries(['tasks', boardId])
  }, 600)

  function findColumnByTaskId(id: string): string | null {
    for (const [status, tasks] of Object.entries(tasksByStatus)) {
      if (tasks.find(t => t.id === id)) return status
    }
    return null
  }

  function handleDragStart({ active }: DragStartEvent) {
    const allTasks = Object.values(tasksByStatus).flat()
    const task = allTasks.find(t => t.id === active.id) ?? null
    setActiveTask(task)
    setSourceColumn(task ? task.status : null) // ← запоминаем откуда тащим
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return

    const activeColumn = findColumnByTaskId(active.id as string)
    const overColumn = STATUSES.includes(over.id as string)
      ? (over.id as string)
      : findColumnByTaskId(over.id as string)

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setTasksByStatus(prev => {
      const activeItems = prev[activeColumn]
      const overItems   = prev[overColumn]
      const activeIndex = activeItems.findIndex(t => t.id === active.id)
      const movedTask   = { ...activeItems[activeIndex], status: overColumn as Task['status'] }

      return {
        ...prev,
        [activeColumn]: activeItems.filter(t => t.id !== active.id),
        [overColumn]:   [...overItems, movedTask],
      }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over) return

    const activeColumn = sourceColumn // ← было: findColumnByTaskId(active.id)
    const overColumn = STATUSES.includes(over.id as string)
      ? (over.id as string)
      : findColumnByTaskId(over.id as string)

    setSourceColumn(null) // ← сбрасываем после дропа

    if (!activeColumn || !overColumn) return

    if (activeColumn === overColumn) {
      setTasksByStatus(prev => {
        const items = prev[activeColumn]
        const oldIndex = items.findIndex(t => t.id === active.id)
        const newIndex = items.findIndex(t => t.id === over.id)
        if (oldIndex === newIndex) return prev

        const reordered = arrayMove(items, oldIndex, newIndex)
          .map((t, i) => ({ ...t, order: i }))

        debouncedSave(reordered)
        return { ...prev, [activeColumn]: reordered }
      })
    } else {
      setTasksByStatus(prev => {
        const updated = { ...prev }
        updated[activeColumn] = updated[activeColumn].map((t, i) => ({ ...t, order: i }))
        updated[overColumn]   = updated[overColumn].map((t, i) => ({ ...t, order: i }))
        debouncedSave([...updated[activeColumn], ...updated[overColumn]])
        return updated
      })
    }
  }

  return { tasksByStatus, activeTask, handleDragStart, handleDragOver, handleDragEnd }
}