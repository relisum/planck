import { move } from '@dnd-kit/helpers'
import { useRef } from 'react'
import { queryClient } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { subtaskApi } from '@/entities/task'

export function useSubtaskDnd(taskId: string, boardId: string) {
  const previousBoard = useRef<Board | null>(null)

  const { mutate: moveSubtask } = subtaskApi.useMove()

  function getBoard() {
    return queryClient.getQueryData<Board>(['board', boardId])
  }

  function setBoard(updater: (old: Board) => Board) {
    queryClient.setQueryData<Board>(['board', boardId], old => {
      if (!old) return old!
      return updater(old)
    })
  }

  function handleDragStart() {
    previousBoard.current = getBoard() ?? null
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation

    if (event.canceled) {
      if (previousBoard.current) {
        queryClient.setQueryData(['board', boardId], previousBoard.current)
      }
      return
    }

    if (!source || !isSortable(source)) return
    if (source.initialIndex === source.index) return

    setBoard(old => {
      const subtaskIds = old.columns
        ?.flatMap(c => c.tasks ?? [])
        .find(t => t.id === taskId)
        ?.subtasks.map(s => s.id) ?? []

      const newIds = move(subtaskIds, event) as string[]

      return {
        ...old,
        columns: old.columns?.map(c => ({
          ...c,
          tasks: c.tasks?.map(t => {
            if (t.id !== taskId) return t
            return {
              ...t,
              subtasks: newIds.map(id => t.subtasks.find(s => s.id === id)!)
            }
          }) ?? []
        })) ?? []
      }
    })

    moveSubtask({
      taskId,
      boardId,
      subtaskId: source.id as string,
      fromIndex: source.initialIndex,
      toIndex: source.index,
    })
  }

  return { handleDragStart, handleDragEnd }
}