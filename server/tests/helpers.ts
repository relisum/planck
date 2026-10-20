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

  async request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const setCookie = res.headers.get('set-cookie')
    if (setCookie) this.cookie = setCookie.split(';')[0]

    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : undefined }
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
