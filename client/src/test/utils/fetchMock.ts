import { vi } from 'vitest'

type Handler = (url: string, init: RequestInit) => { status?: number; body?: unknown } | undefined

/**
 * Подменяет fetch: handler получает путь и параметры запроса и возвращает статус и тело ответа
 */
export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const { status = 200, body } = handler(url, init) ?? {}
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: () => Promise.resolve(body),
    }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function requestBody(fetchMock: ReturnType<typeof mockFetch>, index = 0) {
  const init = fetchMock.mock.calls[index][1] as RequestInit
  return JSON.parse(init.body as string)
}
