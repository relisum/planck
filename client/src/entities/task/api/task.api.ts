import { api, queryClient } from "@/shared/api/apiClient.ts"
import { useMutation } from "react-query"
import type { Task } from "@/entities/task"
import type { Board } from "@/entities/board"

interface MoveTaskParams {
  boardId: string
  taskId: string
  toIndex: number
  targetColumnId: string
  sourceColumnId: string
}

export const taskApi = {
  // useGetByColumn убираем — задачи живут внутри борды в ['board', boardId]

  useCreate: () => useMutation(
    ({ columnId, content }: { columnId: string; content: string }) =>
      api<Task>(`/column/${columnId}/tasks/create`, { method: 'POST', body: { content } }),
    {
      onSuccess: (data, { columnId }) => {
        // Обновляем задачи внутри борды
        queryClient.setQueriesData<Board>(['board'], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c =>
              c.id === columnId
                ? { ...c, tasks: [...(c.tasks ?? []), data] }
                : c
            )
          }
        })
      }
    }
  ),

  useEdit: () => useMutation(
    ({ taskId, content }: { taskId: string; content: string }) =>
      api<Task>(`/tasks/${taskId}/edit`, { method: 'PATCH', body: { content } }),
    {
      onMutate: ({ taskId, content }) => {
        const snapshot = queryClient.getQueriesData<Board>(['board'])

        queryClient.setQueriesData<Board>(['board'], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c => ({
              ...c,
              tasks: c.tasks!.map(t => t.id === taskId ? { ...t, content } : t)
            }))
          }
        })

        return { snapshot }
      },
      onError: (_, __, context) => {
        context?.snapshot?.forEach(([key, value]) => {
          queryClient.setQueryData(key, value)
        })
      }
    }
  ),

  useDelete: () => useMutation(
    ({ taskId }: { taskId: string }) =>
      api(`/tasks/${taskId}`, { method: 'DELETE' }),
    {
      onMutate: ({ taskId, columnId }: { taskId: string; columnId: string }) => {
        const snapshot = queryClient.getQueriesData<Board>(['board'])

        queryClient.setQueriesData<Board>(['board'], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c =>
              c.id === columnId
                ? { ...c, tasks: c.tasks!.filter(t => t.id !== taskId) }
                : c
            )
          }
        })

        return { snapshot }
      },
      onError: (_, __, context) => {
        context?.snapshot?.forEach(([key, value]) => {
          queryClient.setQueryData(key, value)
        })
      }
    }
  ),

  useMove: () => useMutation(
    ({ boardId, taskId, toIndex, targetColumnId }: MoveTaskParams) =>
      api(`/board/${boardId}/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: { toIndex, targetColumnId }
      }),
    {
      // Оптимистичное обновление уже делает useBoardDnd через move()
      // Здесь просто откатываем при ошибке
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  )
}