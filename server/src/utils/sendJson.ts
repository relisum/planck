import { gzipSync } from 'node:zlib'
import { Request, Response } from 'express'

// Сжатые версии закэшированных ответов: данные меняются раз в час–12 часов, пересжимать на каждый запрос незачем
const gzipped = new WeakMap<object, Buffer>()

/**
 * Отдаёт JSON, сжатый gzip, если клиент это поддерживает.
 * Нужен для крупных публичных ответов (/api/github ~17 KB) — nginx не сжимает проксированные ответы
 */
export function sendJson(req: Request, res: Response, data: object) {
  res.vary('Accept-Encoding')
  if (!req.acceptsEncodings('gzip')) {
    res.json(data)
    return
  }
  let body = gzipped.get(data)
  if (!body) {
    body = gzipSync(JSON.stringify(data))
    gzipped.set(data, body)
  }
  res.set({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'gzip' })
  res.send(body)
}
