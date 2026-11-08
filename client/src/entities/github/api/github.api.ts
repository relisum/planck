import { useQuery } from 'react-query'
import { api } from '@/shared/api/apiClient'
import type { GithubData } from '../model/github.types'

export const githubApi = {
  // Сервер кэширует ответ GitHub на час, перезапрашивать чаще смысла нет
  useGetProfile: () => useQuery<GithubData>(
    'github',
    () => api<GithubData>('/github'),
    {
      retry: 1,
      staleTime: Infinity,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    }
  )
}
