import { useMutation } from 'react-query'
import { api, queryClient } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import type { Subtask } from '@/entities/task'

interface MoveSubtaskParams {
  boardId: string
  taskId: string
  subtaskId: string
  fromIndex: number
  toIndex: number
}

interface ToggleSubtaskParams {
  boardId: string
  taskId: string
  subtaskId: string
  done: boolean
}

export const subtaskApi = {
  useMove: () => useMutation(
    ({ taskId, subtaskId, fromIndex, toIndex }: MoveSubtaskParams) =>
      api<{ order: number }>(`/tasks/${taskId}/subtasks/${subtaskId}/move`, {
        method: 'PATCH',
        body: { fromIndex, toIndex }
      }),
    {
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),

  useToggle: () => useMutation(
    ({ subtaskId, done }: ToggleSubtaskParams) =>
      api<Subtask>(`/tasks/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
        body: { done }
      }),
    {
      onMutate: ({ boardId, taskId, subtaskId, done }) => {
        queryClient.setQueryData<Board>(['board', boardId], old => {
          if (!old) return old!
          return {
            ...old,
            columns: old.columns?.map(c => ({
              ...c,
              tasks: c.tasks?.map(t => {
                if (t.id !== taskId) return t
                return {
                  ...t,
                  subtasks: t.subtasks.map(s =>
                    s.id === subtaskId ? { ...s, done } : s
                  )
                }
              }) ?? []
            })) ?? []
          }
        })
      },
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  )
}