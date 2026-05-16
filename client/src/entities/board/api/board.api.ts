import { api } from '@/shared/api/apiClient'
import type { Board } from '@/entities/board'
import {useQuery} from "react-query";


export const boardApi = {
  useGetAll: () => useQuery(
    ['boards'],
    () => api<{ boards: Board[] }>('/api/boards').then(r => r.boards)
  ),

  create: (data: Omit<Board, 'id' | 'createdAt'>) =>
    api<Board>('/api/boards', { method: 'POST', body: data }),

  update: (id: string, data: Partial<Omit<Board, 'id' | 'createdAt'>>) =>
    api<Board>(`/api/boards/${id}`, { method: 'PATCH', body: data }),

  remove: (id: string) =>
    api(`/api/boards/${id}`, { method: 'DELETE' }),
}