import { NextFunction, Request, Response } from 'express'
import { prisma } from '../db/client'

/**
 * board  — изменилось содержимое доски (колонки, задачи, участники, название)
 * boards — изменился только список досок пользователя (доступ выдан/отозван, доска удалена/восстановлена)
 */
export type RealtimeEvent = 'board' | 'boards'

interface Connection {
  res: Response
  clientId: string | null
}

const HEARTBEAT_MS = 25_000

const connections = new Map<string, Set<Connection>>()

declare global {
  namespace Express {
    interface Request {
      /** Id вкладки клиента — чтобы не присылать автору изменения его же событие */
      clientId: string | null
    }
  }
}

export function clientIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.clientId = req.header('x-client-id') ?? null
  next()
}

/**
 * GET /api/events — поток Server-Sent Events для текущего пользователя
 */
export function eventsHandler(req: Request, res: Response) {
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : null
  const connection: Connection = { res, clientId }

  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // nginx не должен буферизовать поток
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')

  const userConnections = connections.get(req.userId) ?? new Set()
  userConnections.add(connection)
  connections.set(req.userId, userConnections)

  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS)

  req.on('close', () => {
    clearInterval(heartbeat)
    userConnections.delete(connection)
    if (userConnections.size === 0) connections.delete(req.userId)
  })
}

export function sendToUsers(userIds: string[], event: RealtimeEvent, data: object, exceptClientId: string | null) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  for (const userId of userIds) {
    for (const connection of connections.get(userId) ?? []) {
      if (exceptClientId && connection.clientId === exceptClientId) continue
      connection.res.write(payload)
    }
  }
}

/**
 * Оповещает всех участников доски, кроме вкладки, которая сделала изменение
 */
export async function notifyBoard(req: Request, boardId: string, event: RealtimeEvent = 'board') {
  if (connections.size === 0) return

  try {
    const members = await prisma.boardMember.findMany({ where: { boardId }, select: { userId: true } })
    sendToUsers(members.map(m => m.userId), event, { boardId }, req.clientId)
  } catch (err) {
    console.error('Realtime notify failed:', err)
  }
}

export function notifyUsers(req: Request, userIds: string[], event: RealtimeEvent, data: object = {}) {
  sendToUsers(userIds, event, data, req.clientId)
}

/** Для тестов: число открытых соединений пользователя */
export function connectionCount(userId: string) {
  return connections.get(userId)?.size ?? 0
}
