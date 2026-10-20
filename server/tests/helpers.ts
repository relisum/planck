import { randomUUID } from 'crypto'
import type { AddressInfo } from 'net'
import type { Server } from 'http'
import { createApp } from '../src/app'

let server: Server | null = null
let baseUrl = ''

export async function startServer() {
  if (server) return
  server = createApp().listen(0)
  await new Promise<void>(resolve => server!.once('listening', () => resolve()))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
}

export async function stopServer() {
  if (!server) return
  await new Promise<void>(resolve => server!.close(() => resolve()))
  server = null
}

export interface ApiResponse<T = any> {
  status: number
  body: T
}

/**
 * HTTP-клиент с собственной cookie — один экземпляр на «пользователя»
 */
export class Client {
  cookie: string | null = null
  /** Id вкладки: события, вызванные этим клиентом, ему не приходят */
  clientId = randomUUID()

  async request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const setCookie = res.headers.get('set-cookie')
    if (setCookie) this.cookie = setCookie.split(';')[0]

    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : undefined }
  }

  /**
   * Подписка на Server-Sent Events. clientId можно переопределить, чтобы имитировать другую вкладку
   */
  async subscribe(clientId = this.clientId) {
    const controller = new AbortController()
    const res = await fetch(`${baseUrl}/events?clientId=${clientId}`, {
      headers: this.cookie ? { Cookie: this.cookie } : {},
      signal: controller.signal,
    })
    return new EventStream(res, controller)
  }

  get<T = any>(path: string) { return this.request<T>('GET', path) }
  post<T = any>(path: string, body?: unknown) { return this.request<T>('POST', path, body) }
  patch<T = any>(path: string, body?: unknown) { return this.request<T>('PATCH', path, body) }
  delete<T = any>(path: string) { return this.request<T>('DELETE', path) }
}

export const uniqueName = (prefix = 'user') => `${prefix}_${randomUUID().slice(0, 8)}`

export const PASSWORD = 'secret-password'

/**
 * Регистрирует пользователя по паролю и возвращает авторизованный клиент
 */
export async function registerUser(prefix?: string) {
  const client = new Client()
  const username = uniqueName(prefix)
  const res = await client.post('/auth/register/password', { username, password: PASSWORD })
  if (res.status !== 200) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  return { client, user: res.body as { id: string; username: string; displayName: string } }
}

export async function createBoard(client: Client, title = 'Board') {
  const res = await client.post('/boards', { title })
  if (res.status !== 200) throw new Error(`create board failed: ${JSON.stringify(res.body)}`)
  return res.body as { id: string; title: string; role: string }
}

export interface ServerEvent {
  event: string
  data: any
}

/**
 * Читает поток SSE и копит события
 */
export class EventStream {
  events: ServerEvent[] = []
  status: number
  private reading: Promise<void>

  constructor(res: Response, private controller: AbortController) {
    this.status = res.status
    this.reading = this.read(res)
  }

  private async read(res: Response) {
    if (!res.body || res.status !== 200) return
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true })
        let index
        while ((index = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, index)
          buffer = buffer.slice(index + 2)
          const event = raw.match(/^event: (.+)$/m)?.[1]
          const data = raw.match(/^data: (.+)$/m)?.[1]
          if (event) this.events.push({ event, data: data ? JSON.parse(data) : null })
        }
      }
    } catch {
      // поток закрыт через abort
    }
  }

  /** Ждёт событие, удовлетворяющее условию */
  async waitFor(predicate: (e: ServerEvent) => boolean, timeout = 1000) {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      const found = this.events.find(predicate)
      if (found) return found
      await new Promise(r => setTimeout(r, 10))
    }
    throw new Error(`Event not received, got: ${JSON.stringify(this.events)}`)
  }

  close() {
    this.controller.abort()
    return this.reading
  }
}

/** Даёт серверу время доставить события, которых быть не должно */
export const settle = () => new Promise(r => setTimeout(r, 100))
