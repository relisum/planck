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
  )
}