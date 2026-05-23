import {api, queryClient} from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import {useMutation, useQuery} from "react-query";


export const boardApi = {
  useGetAll: () => useQuery(
    ['boards'],
    () => api<Board[]>('/boards')
  ),

  useMove: () => useMutation(
    ({ sourceId, fromIndex, toIndex }: { sourceId: string; fromIndex: number, toIndex: number }) =>
      api<Board>(`/boards/move/${sourceId}`, {
        method: 'PATCH',
        body: { fromIndex, toIndex },
      }),
    {
      onSuccess: () => queryClient.invalidateQueries(['boards'])
    }
  ),

  useCreate: (onSuccess?: (board: Board) => void) => useMutation(
    ({ title }: { title: string }) =>
      api<Board>('/boards', {
        method: 'POST',
        body: { title }
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData<Board[]>(['boards'], (old = []) => [...old, data])
        onSuccess?.(data)
      },
      onError: (err) => {
        console.error('create error:', err)
      }
    }
  ),

  useDelete: () => useMutation(
    ({ id }: { id: string }) =>
      api<Board>(`/boards/${id}`, {method: 'DELETE', body: { id } }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['boards'])
      }
    }
  ),

  useRestore: () => useMutation(
    ({ id }: { id: string }) =>
      api<Board>(`/boards/${id}/restore`, { method: 'PATCH', body: { id } }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['boards'])
      }
    }
  ),

  useRename: () => useMutation(
    ({ id, title }: { id: string, title: string }) =>
      api<Board>(`/boards/${id}/rename`, {method: 'PATCH', body: { title }}),
    {
      onMutate: ({ id, title }) => {
        queryClient.setQueryData<Board[]>(['boards'], (old = []) =>
          old.map(board => board.id === id ? { ...board, title } : board)
        )
      },
      onError: async () => {
        await queryClient.invalidateQueries(['boards'])
      }
    }
  )
}