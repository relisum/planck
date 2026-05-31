import { useQuery } from 'react-query'
import { api } from '@/shared/api/apiClient'
import type { User } from '@/entities/user'

export const userApi = {
  useMe: () => useQuery<User | null>(
    'me',
    async () => {
      try {
        return await api<User>('/auth/me')
      } catch {
        return null
      }
    },
    {
      retry: false,
      staleTime: Infinity,
      refetchInterval: false,
    }
  )
}