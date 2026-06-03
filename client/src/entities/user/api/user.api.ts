import { useQuery } from 'react-query'
import { api } from '@/shared/api/apiClient'
import type { User } from '@/entities/user'

export const userApi = {
  useMe: () => useQuery<User | null>(
    'me',
    () => api<User>('/auth/me'),
    {
      retry: false,
      staleTime: Infinity,
      refetchInterval: false,
    }
  )
}