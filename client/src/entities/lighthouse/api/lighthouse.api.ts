import { useQuery } from 'react-query'
import { api } from '@/shared/api/apiClient'
import type { LighthouseReport } from '../model/lighthouse.types'

export const lighthouseApi = {
  // Замер на сервере кэшируется на 12 часов; если сервис недоступен — блок просто не показываем
  useGetReport: () => useQuery<LighthouseReport>(
    'lighthouse',
    () => api<LighthouseReport>('/lighthouse'),
    {
      retry: false,
      staleTime: Infinity,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    }
  )
}
