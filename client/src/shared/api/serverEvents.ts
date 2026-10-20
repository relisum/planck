import { BASE_URL, CLIENT_ID } from './apiClient'

export type ServerEventName = 'board' | 'boards'

export interface ServerEventData {
  boardId?: string
}

interface SubscribeOptions {
  onEvent: (event: ServerEventName, data: ServerEventData) => void
  /** Соединение восстановлено после обрыва — события за это время могли потеряться */
  onReconnect: () => void
}

const EVENTS: ServerEventName[] = ['board', 'boards']

/**
 * Подписка на Server-Sent Events. EventSource сам переподключается после обрыва.
 */
export function subscribeServerEvents({ onEvent, onReconnect }: SubscribeOptions) {
  if (typeof EventSource === 'undefined') return () => {}

  const source = new EventSource(`${BASE_URL}/events?clientId=${CLIENT_ID}`, { withCredentials: true })
  let hadError = false

  source.addEventListener('open', () => {
    if (hadError) onReconnect()
    hadError = false
  })

  source.addEventListener('error', () => {
    hadError = true
  })

  for (const name of EVENTS) {
    source.addEventListener(name, (e) => {
      let data: ServerEventData = {}
      try {
        data = JSON.parse((e as MessageEvent).data)
      } catch {
        // пустые данные — просто обновляем всё
      }
      onEvent(name, data)
    })
  }

  return () => source.close()
}
