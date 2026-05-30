import { api, queryClient } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import { useMutation, useQuery } from 'react-query'

export const boardApi = {
  useGetAll: () => useQuery(
    ['boards'],
    () => api<Board[]>('/boards')
  ),

  useGetBoard: <T = Board>({ id, select }: { id: string; select?: (board: Board) => T }) =>
    useQuery({
      queryKey: ['board', id],
      queryFn: () => api<Board>(`/board/${id}`),
      staleTime: 30_000,
      select,
    }),

  useMove: () => useMutation(
    ({sourceId, fromIndex, toIndex}: {
      sourceId: string
      fromIndex: number
      toIndex: number
    }) =>
      api<Board>(`/boards/${sourceId}/move`, {
        method: 'PATCH',
        body: {fromIndex, toIndex},
      }),
    {
      onMutate: ({fromIndex, toIndex}) => {
        const snapshot = queryClient.getQueryData<Board[]>(['boards'])

        queryClient.setQueryData<Board[]>(['boards'], old => {
          if (!old) return old!
          const boards = [...old]
          const [moved] = boards.splice(fromIndex, 1)
          boards.splice(toIndex, 0, moved)
          return boards
        })

        return {snapshot}
      },
      onError: (_, __, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(['boards'], context.snapshot)
        }
      },
    }
  ),

  useCreate: (onSuccess?: (board: Board) => void) => useMutation(
    ({title}: { title: string }) =>
      api<Board>('/boards', {
        method: 'POST',
        body: {title}
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData<Board[]>(['boards'], (old = []) => [...old, data])
        queryClient.setQueryData(['board', data.id], data)
        onSuccess?.(data)
      }
    }
  ),

  useDelete: () => useMutation(
    ({id}: { id: string }) =>
      api<Board>(`/boards/${id}/delete`, { method: 'DELETE' }),
    {
      onSuccess: async (_, {id}) => {
        queryClient.removeQueries(['board', id])
        await queryClient.invalidateQueries(['boards'])
      }
    }
  ),

  useRestore: () => useMutation(
    ({ id }: { id: string }) =>
      api<Board>(`/boards/${id}/restore`, { method: 'PATCH' }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['boards'])
      }
    }
  ),

  useRename: () => useMutation(
    ({ id, title }: { id: string; title: string }) =>
      api<Board>(`/boards/${id}/rename`, {
        method: 'PATCH',
        body: { title }
      }),
    {
      onMutate: ({ id, title }) => {
        const snapshotList = queryClient.getQueryData<Board[]>(['boards'])
        const snapshotBoard = queryClient.getQueryData<Board>(['board', id])

        queryClient.setQueryData<Board[]>(['boards'], (old = []) =>
          old.map(board => board.id === id ? { ...board, title } : board)
        )
        queryClient.setQueryData<Board>(['board', id], old =>
          old ? { ...old, title } : old!
        )

        return { snapshotList, snapshotBoard }
      },
      onError: async (_, { id }, context) => {
        if (context?.snapshotList) {
          queryClient.setQueryData(['boards'], context.snapshotList)
        }
        if (context?.snapshotBoard) {
          queryClient.setQueryData(['board', id], context.snapshotBoard)
        }
      }
    }
  )
}