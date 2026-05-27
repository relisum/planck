import { move } from '@dnd-kit/helpers'
import { useRef } from 'react'
import { queryClient } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import type {DragOverEvent, DragEndEvent, DragStartEvent} from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { taskApi } from '@/entities/task'
import { columnApi } from '@/entities/column'

export function useBoardDnd(boardId: string) {
  const previousBoard = useRef<Board | null>(null)
  const dragSource = useRef<{ columnId: string; index: number } | null>(null)

  const { mutate: moveTask } = taskApi.useMove()
  const { mutate: moveColumn } = columnApi.useMove()

  function getBoard() {
    return queryClient.getQueryData<Board>(['board', boardId])
  }

  function setBoard(updater: (old: Board) => Board) {
    queryClient.setQueryData<Board>(['board', boardId], old => {
      if (!old) return old!
      return updater(old)
    })
  }

  function handleDragStart(event: DragStartEvent) {
    previousBoard.current = getBoard() ?? null

    const { source } = event.operation
    if (source?.type === 'task' && isSortable(source)) {
      dragSource.current = {
        columnId: source.data?.columnId as string,
        index: source.index,
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { source, target } = event.operation
    if (source?.type === 'column') return
    if (!source || !target) return

    setBoard(old => {
      const record = Object.fromEntries(
        old.columns?.map(c => [c.id, c.tasks ?? []]) ?? []
      )

      const targetColumnId: string | undefined =
        (target.data as any)?.columnId  // droppable TaskList передаёт columnId в data
        ?? (target.type === 'task' ? (target.data as any)?.columnId : undefined)

      if (!targetColumnId || !record[targetColumnId]) return old

      const sourceColumnId = source.data?.columnId as string
      if (!sourceColumnId || !record[sourceColumnId]) return old

      const isDroppableContainer = target.type !== 'task'
      if (isDroppableContainer && record[targetColumnId].length === 0) {
        const taskId = source.id as string
        const updatedSource = record[sourceColumnId].filter(t => t.id !== taskId)
        const task = record[sourceColumnId].find(t => t.id === taskId)
        if (!task) return old

        return {
          ...old,
          columns: old.columns?.map(c => {
            if (c.id === sourceColumnId) return { ...c, tasks: updatedSource }
            if (c.id === targetColumnId) return { ...c, tasks: [task] }
            return c
          }) ?? []
        }
      }

      // Обычный случай — делегируем move()
      const updated = move(record, event)
      return {
        ...old,
        columns: old.columns?.map(c => ({ ...c, tasks: updated[c.id] ?? [] })) ?? []
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation

    if (event.canceled) {
      if (source?.type === 'task' && previousBoard.current) {
        queryClient.setQueryData(['board', boardId], previousBoard.current)
      }
      dragSource.current = null
      return
    }

    if (source?.type === 'task' && isSortable(source)) {
      const targetColumnId = source.data?.columnId as string
      const initialColumnId = dragSource.current?.columnId ?? targetColumnId
      const initialIndex = dragSource.current?.index ?? source.index

      // Не отправляем запрос если позиция не изменилась
      const sameColumn = initialColumnId === targetColumnId
      const sameIndex = initialIndex === source.index

      if (!sameColumn || !sameIndex) {
        moveTask({
          boardId,
          taskId: source.id as string,
          toIndex: source.index,
          targetColumnId,
          sourceColumnId: initialColumnId,
        })
      }

      dragSource.current = null
    }

    if (source?.type === 'column' && isSortable(source)) {
      if (source.initialIndex === source.index) return

      setBoard(old => {
        const ids = old.columns?.map(c => c.id) ?? []
        const newIds = move(ids, event) as string[]
        return {
          ...old,
          columns: newIds.map(id => old.columns!.find(c => c.id === id)!)
        }
      })

      moveColumn({
        boardId,
        columnId: source.id as string,
        fromIndex: source.initialIndex,
        toIndex: source.index,
      })
    }
  }

  return { handleDragStart, handleDragOver, handleDragEnd }
}