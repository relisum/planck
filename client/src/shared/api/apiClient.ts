import {QueryClient} from "react-query";


export const BASE_URL = import.meta.env.VITE_API_URL

/**
 * Id вкладки: сервер не присылает в realtime-поток события, вызванные этой же вкладкой
 */
export const CLIENT_ID = typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': CLIENT_ID },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  })

  if (res.status === 401) return null as T

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchInterval: 1000 * 60,
    },
  },
})