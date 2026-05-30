import { useMutation } from 'react-query'
import { api, queryClient } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import type {Subtask, Task} from '@/entities/task'

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

interface ChangeSubtaskParams {
  boardId: string
  taskId: string
  subtaskId: string
  content: string
}

interface CreateSubtaskParams {
  boardId: string
  taskId: string
  content: string
}

interface DeleteSubtaskParams {
  boardId: string
  taskId: string
  subtaskId: string
}

function updateTask(board: Board, taskId: string, patch: (task: Task) => Task): Board {
  return {
    ...board,
    columns: board.columns?.map(c => ({
      ...c,
      tasks: c.tasks?.map(t => t.id !== taskId ? t : patch({
        ...t,
        subtasks: t.subtasks ?? []
      })) ?? []
    })) ?? []
  }
}

function updateSubtask(
  board: Board,
  taskId: string,
  subtaskId: string,
  patch: Partial<Subtask>
): Board {
  return updateTask(board, taskId, task => ({
    ...task,
    subtasks: task.subtasks.map(s => s.id !== subtaskId ? s : { ...s, ...patch })
  }))
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
        queryClient.setQueryData<Board>(['board', boardId], old =>
          old ? updateSubtask(old, taskId, subtaskId, { done }) : old!
        )
      },
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),

  useChange: () => useMutation(
    ({ subtaskId, content }: ChangeSubtaskParams) =>
      api<Subtask>(`/tasks/subtasks/${subtaskId}/change`, { method: 'PATCH', body: { content } }),
    {
      onMutate: ({ boardId, taskId, subtaskId, content }) => {
        queryClient.setQueryData<Board>(['board', boardId], old =>
          old ? updateSubtask(old, taskId, subtaskId, { content }) : old!
        )
      },
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),

  useCreate: () => useMutation(
    ({ taskId, content }: CreateSubtaskParams) =>
      api<Subtask>(`/tasks/${taskId}/subtasks/create`, { method: 'POST', body: { content } }),
    {
      onMutate: ({ boardId, taskId, content }) => {
        const tempId = `temp-${Date.now()}`
        const tempSubtask: Subtask = {
          id: tempId,
          taskId,
          content,
          done: false,
          order: 99999,
          deletedAt: null,
        }

        queryClient.setQueryData<Board>(['board', boardId], old =>
          old ? updateTask(old, taskId, task => ({
            ...task,
            subtasks: [...task.subtasks, tempSubtask]
          })) : old!
        )

        return { tempId }
      },
      onSuccess: (created, { boardId, taskId }, ctx) => {
        if (!ctx?.tempId) return
        queryClient.setQueryData<Board>(['board', boardId], old =>
          old ? updateTask(old, taskId, task => ({
            ...task,
            subtasks: task.subtasks.map(s => s.id === ctx.tempId ? created : s)
          })) : old!
        )
      },
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),

  useDelete: () => useMutation(
    ({ subtaskId }: DeleteSubtaskParams) =>
      api(`/tasks/subtasks/${subtaskId}/delete`, { method: 'DELETE' }),
    {
      onMutate: ({ boardId, taskId, subtaskId }) => {
        queryClient.setQueryData<Board>(['board', boardId], old =>
          old ? updateTask(old, taskId, task => ({
            ...task,
            subtasks: task.subtasks.filter(s => s.id !== subtaskId)
          })) : old!
        )
      },
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  )
}