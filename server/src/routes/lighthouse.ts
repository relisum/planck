// Lighthouse-оценки самого сайта через PageSpeed Insights.
// Без ключа у Google общая дневная квота и она быстро кончается — нужен PAGESPEED_API_KEY.
// Замер долгий (~20–30 с), поэтому результат кэшируется на 12 часов, а после неудачи 5 минут не повторяем.
// Причина неудачи отдаётся в ответе 503, чтобы её было видно без доступа к логам сервера.

import { Router } from 'express'
import { AppError } from '../middleware/errorHandler'

export const lighthouseRouter = Router()

const TTL = 12 * 60 * 60 * 1000
const RETRY_AFTER_FAILURE = 5 * 60 * 1000
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const

interface LighthousePayload {
  url: string
  scores: Record<string, number>
  lcp: string | null
  cls: string | null
  fetchedAt: string
}

let cache: { data: LighthousePayload; expiresAt: number } | null = null
let failure: { at: number; reason: string } | null = null
let pending: Promise<LighthousePayload> | null = null

async function measure(): Promise<LighthousePayload> {
  const url = process.env.SITE_URL ?? 'https://plancktask.site/'
  const params = new URLSearchParams({ url, strategy: 'mobile' })
  CATEGORIES.forEach(c => params.append('category', c))
  if (process.env.PAGESPEED_API_KEY) params.set('key', process.env.PAGESPEED_API_KEY)

  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) {
    // Google присылает понятное сообщение («API key not valid…», «…has not been used…»); ключ из него вырезаем на всякий случай
    const body: any = await res.json().catch(() => null)
    const message = String(body?.error?.message ?? res.statusText).replace(/AIza[\w-]+/g, '***').slice(0, 300)
    throw new Error(`PageSpeed ${res.status}: ${message}`)
  }
  const json: any = await res.json()
  const result = json.lighthouseResult

  return {
    url,
    scores: Object.fromEntries(CATEGORIES.map(c => [c, Math.round((result.categories[c]?.score ?? 0) * 100)])),
    lcp: result.audits['largest-contentful-paint']?.displayValue ?? null,
    cls: result.audits['cumulative-layout-shift']?.displayValue ?? null,
    fetchedAt: result.fetchTime ?? new Date().toISOString(),
  }
}

function unavailable(reason: string) {
  const keyNote = process.env.PAGESPEED_API_KEY ? '' : ' (PAGESPEED_API_KEY is not set)'
  return new AppError(503, `Lighthouse is unavailable: ${reason}${keyNote}`)
}

lighthouseRouter.get('/', async (_req, res) => {
  if (cache && cache.expiresAt > Date.now()) {
    res.json(cache.data)
    return
  }
  // Недавно не получилось — не дёргаем Google на каждый заход, отдаём что есть
  if (failure && Date.now() - failure.at < RETRY_AFTER_FAILURE) {
    if (cache) {
      res.json(cache.data)
      return
    }
    throw unavailable(failure.reason)
  }

  try {
    pending ??= measure()
    const data = await pending
    cache = { data, expiresAt: Date.now() + TTL }
    failure = null
    res.json(data)
  } catch (err) {
    failure = { at: Date.now(), reason: err instanceof Error ? err.message : String(err) }
    console.error('Lighthouse fetch failed:', err)
    if (cache) {
      res.json(cache.data)
      return
    }
    throw unavailable(failure.reason)
  } finally {
    pending = null
  }
})
