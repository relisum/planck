import {useMutation} from "react-query";
import {api, queryClient} from "@/shared/api/apiClient.ts";
import {type Board} from "@/entities/board";
import type {Column} from "@/entities/column";

interface MoveColumnParams {
  boardId: string
  columnId: string
  fromIndex: number
  toIndex: number
}

interface RenameColumnParams {
  boardId: string
  columnId: string
  title: string
}

interface CreateColumnParams {
  boardId: string
  title?: string
}

interface DeleteColumnParams {
  boardId: string
  columnId: string
}

interface RestoreColumnParams {
  boardId: string
  columnId: string
}

export const columnApi = {
  useCreate: ({onSuccess}: { onSuccess: (col: Column) => void }) => useMutation(
    ({ boardId }: CreateColumnParams) =>
      api<Column>(`/board/${boardId}/columns/create`, { method: 'POST' }),
    {
      onMutate: ({ boardId, title = 'Новая колонка' }) => {
        const snapshot = queryClient.getQueryData<Board>(['board', boardId])

        const tempId = `temp-${Date.now()}`
        const tempColumn: Column = {
          id: tempId,
          boardId,
          title,
          order: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          tasks: []
        }

        queryClient.setQueryData<Board>(['board', boardId], (old) => {
          if (!old) return old!
          return { ...old, columns: [...(old.columns ?? []), tempColumn] }
        })

        return { snapshot, tempId }
      },
      onSuccess: (data, { boardId }, context) => {
        queryClient.setQueryData<Board>(['board', boardId], (old) => {
          if (!old) return old!
          return {
            ...old,
            columns: old.columns?.map(c => c.id === context?.tempId ? data : c) ?? []
          }
        })
        onSuccess?.(data)
      },
      onError: (_, { boardId }, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(['board', boardId], context.snapshot)
        }
      }
    }
  ),

  useRename: () => useMutation(
    ({ columnId, title }: RenameColumnParams) =>
      api<Column>(`/board/columns/${columnId}/rename`, { method: 'PATCH', body: { title } }),
    {
      onMutate: ({ boardId, columnId, title }) => {
        const snapshot = queryClient.getQueryData<Board>(['board', boardId])

        queryClient.setQueryData<Board>(['board', boardId], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.map(c => c.id === columnId ? { ...c, title } : c)
          }
        })

        return { snapshot }
      },
      onError: async (_, { boardId }, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(['board', boardId], context.snapshot)
        } else {
          await queryClient.invalidateQueries(['board', boardId])
        }
      }
    }
  ),

  useMove: () => useMutation(
    ({ boardId, columnId, fromIndex, toIndex }: MoveColumnParams) =>
      api<{ order: number }>(`/board/${boardId}/columns/${columnId}/move`, {
        method: 'PATCH',
        body: { fromIndex, toIndex }
      }),
    {
      onError: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),

  useDelete: () => useMutation(
    ({ columnId }: DeleteColumnParams) =>
      api<{ deleted: string }>(`/board/columns/${columnId}/delete`, { method: 'DELETE' }),
    {
      onMutate: ({ boardId, columnId }) => {
        const snapshot = queryClient.getQueryData<Board>(['board', boardId])

        queryClient.setQueryData<Board>(['board', boardId], (old) => {
          if (!old?.columns) return old!
          return {
            ...old,
            columns: old.columns.filter(c => c.id !== columnId)
          }
        })

        return { snapshot }
      },
      onError: async (_, { boardId }, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(['board', boardId], context.snapshot)
        } else {
          await queryClient.invalidateQueries(['board', boardId])
        }
      }
    }
  ),

  useRestore: () => useMutation(
    ({ columnId }: RestoreColumnParams) =>
      api(`/board/columns/${columnId}/restore`, { method: 'PATCH' }),
    {
      onSuccess: async (_, { boardId }) => {
        await queryClient.invalidateQueries(['board', boardId])
      }
    }
  ),
}