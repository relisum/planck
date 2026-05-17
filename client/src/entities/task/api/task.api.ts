import {useQuery} from "react-query";
import {api} from "@/shared/api/apiClient.ts";
import type {Task} from "@/entities/task";


export const taskApi = {
  useGetByBoardId: (boardId: string) => useQuery(
    ['tasks', boardId],
    () => api<Task[]>(`/api/tasks/${boardId}`),
    { enabled: !!boardId }
  ),

  reorder: (id: string, order: number) =>
    api(`/api/tasks/${id}`, { method: 'PATCH', body: { order } }),

  update: (id: string, data: Partial<Task>) =>
    api(`/api/tasks/${id}`, { method: 'PATCH', body: data }),
}