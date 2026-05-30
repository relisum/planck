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
  useCreate: () => useMutation(
    ({ columnId, content }: { columnId: string; content: string }) =>
      api<Task>(`/column/${columnId}/tasks/create`, { method: 'POST', body: { content } }),
    {
      onMutate: ({ columnId, content }) => {
        const queries = queryClient.getQueriesData<Board>(['board'])
        const [boardQueryKey, boardData] = queries.find(([, board]) =>
          board?.columns?.some(c => c.id === columnId)
        ) ?? []
        const boardId = boardQueryKey?.[1] as string | undefined

        const snapshot = boardId
          ? queryClient.getQueryData<Board>(['board', boardId])
          : undefined

        const tempId = `temp-${Date.now()}`
        const tempTask: Task = {
          id: tempId,
          taskId: -1,
          columnId,
          boardId: boardData?.id ?? '',
          content,
          order: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          subtasks: []
        }

        queryClient.setQueriesData<Board>(['board'], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c =>
              c.id === columnId
                ? { ...c, tasks: [...(c.tasks ?? []), tempTask] }
                : c
            )
          }
        })

        return { snapshot, boardId, tempId }
      },
      onSuccess: (data, { columnId }, context) => {
        queryClient.setQueriesData<Board>(['board'], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c =>
              c.id === columnId
                ? { ...c, tasks: c.tasks?.map(t => t.id === context?.tempId
                    ? { ...data, subtasks: data.subtasks ?? [] }
                    : t) ?? []
                }
                : c
            )
          }
        })
      },
      onError: async (_, __, context) => {
        if (context?.snapshot && context.boardId) {
          queryClient.setQueryData(['board', context.boardId], context.snapshot)
        } else {
          await queryClient.invalidateQueries(['board'])
        }
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
              tasks: c.tasks?.map(t => t.id === taskId ? { ...t, content } : t) ?? null
            }))
          }
        })

        return { snapshot }
      },
      onError: async (_, __, context) => {
        if (context?.snapshot) {
          for (const [key, data] of context.snapshot) {
            queryClient.setQueryData(key, data)
          }
        } else {
          await queryClient.invalidateQueries(['board'])
        }
      }
    }
  ),

  useDelete: () => useMutation(
    (task: Task) =>
      api(`/tasks/${task.id}/delete`, { method: 'DELETE' }),
    {
      onMutate: (task) => {
        const snapshot = queryClient.getQueryData<Board>(['board', task.boardId])

        queryClient.setQueryData<Board>(['board', task.boardId], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(column => ({
              ...column,
              tasks: column.tasks?.filter(t => t.id !== task.id) ?? null
            }))
          }
        })

        return { snapshot }
      },
      onError: async (_, task, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(['board', task.boardId], context.snapshot)
        } else {
          await queryClient.invalidateQueries(['board', task.boardId])
        }
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
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  )
}