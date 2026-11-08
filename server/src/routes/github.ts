// Публичные данные GitHub-профиля для лендинга-портфолио.
// Ходим в GitHub с сервера: календарь вкладов отдаётся только HTML-страницей без CORS,
// а кэш на час избавляет от лимита 60 запросов/час на неавторизованный REST API.

import { Router } from 'express'
import { AppError } from '../middleware/errorHandler'
import { sendJson } from '../utils/sendJson'

export const githubRouter = Router()

const USERNAME = 'relisum'
const TTL = 60 * 60 * 1000
const HEADERS = { 'User-Agent': 'planck-portfolio', Accept: 'application/vnd.github+json' }

interface GithubProfile {
  login: string
  name: string | null
  bio: string | null
  avatarUrl: string
  htmlUrl: string
  followers: number
  following: number
  publicRepos: number
  createdAt: string
}

interface GithubRepo {
  name: string
  description: string | null
  htmlUrl: string
  homepage: string | null
  language: string | null
  languages: Record<string, number>
  stars: number
  pushedAt: string
}

interface ContributionDay {
  date: string
  level: number
  count: number
}

interface GithubEvent {
  type: string
  repo: string
  createdAt: string
  commitCount: number
  commits: string[]
}

interface GithubPayload {
  profile: GithubProfile
  repos: GithubRepo[]
  contributions: ContributionDay[]
  events: GithubEvent[]
  fetchedAt: string
}

let cache: { data: GithubPayload; expiresAt: number } | null = null
let pending: Promise<GithubPayload> | null = null

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

// Календарь вкладов: <td data-date="…" data-level="0-4"> + <tool-tip for="id">N contributions…</tool-tip>
async function loadContributions(): Promise<ContributionDay[]> {
  const res = await fetch(`https://github.com/users/${USERNAME}/contributions`, { headers: { 'User-Agent': HEADERS['User-Agent'] } })
  if (!res.ok) return []
  const html = await res.text()

  const counts = new Map<string, number>()
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^(\d+)/.exec(m[2].trim())
    counts.set(m[1], n ? Number(n[1]) : 0)
  }

  const days: ContributionDay[] = []
  for (const m of html.matchAll(/<td[^>]*data-date="([\d-]+)"[^>]*>/g)) {
    const tag = m[0]
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0)
    const id = /id="([^"]+)"/.exec(tag)?.[1]
    days.push({ date: m[1], level, count: id ? counts.get(id) ?? 0 : 0 })
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

// В PushEvent GitHub больше не присылает список коммитов — достаём его через compare before...head
async function loadEvents(): Promise<GithubEvent[]> {
  const raw = await getJson<any[]>(`https://api.github.com/users/${USERNAME}/events/public?per_page=30`)
  const recent = [...raw].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8)
  return Promise.all(recent.map(async e => {
    const repoFull = String(e.repo?.name ?? '')
    const event: GithubEvent = {
      type: e.type,
      repo: repoFull.replace(`${USERNAME}/`, ''),
      createdAt: e.created_at,
      commitCount: 0,
      commits: [],
    }
    const { before, head } = e.payload ?? {}
    if (e.type !== 'PushEvent' || !before || !head) return event

    const compare = await getJson<any>(`https://api.github.com/repos/${repoFull}/compare/${before}...${head}`).catch(() => null)
    const commits: any[] = compare?.commits ?? []
    event.commitCount = compare?.total_commits ?? commits.length
    // compare отдаёт коммиты от старых к новым, показываем свежие
    event.commits = commits.slice(-3).reverse().map(c => String(c.commit?.message ?? '').split('\n')[0])
    return event
  }))
}

async function load(): Promise<GithubPayload> {
  const [user, rawRepos, events, contributions] = await Promise.all([
    getJson<any>(`https://api.github.com/users/${USERNAME}`),
    getJson<any[]>(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed`),
    loadEvents().catch(() => []),
    loadContributions().catch(() => []),
  ])

  const ownRepos = rawRepos.filter(r => !r.fork && !r.private)
  const languages = await Promise.all(
    ownRepos.map(r => getJson<Record<string, number>>(r.languages_url).catch(() => ({})))
  )

  return {
    profile: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
    },
    repos: ownRepos.map((r, i) => ({
      name: r.name,
      description: r.description,
      htmlUrl: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      languages: languages[i],
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    })),
    contributions,
    events,
    fetchedAt: new Date().toISOString(),
  }
}

githubRouter.get('/', async (req, res) => {
  if (cache && cache.expiresAt > Date.now()) {
    sendJson(req, res, cache.data)
    return
  }

  try {
    // Параллельные запросы при пустом кэше ждут один и тот же поход в GitHub
    pending ??= load()
    const data = await pending
    cache = { data, expiresAt: Date.now() + TTL }
    sendJson(req, res, data)
  } catch (err) {
    console.error('GitHub fetch failed:', err)
    // GitHub недоступен — отдаём устаревшие данные, если они есть
    if (cache) {
      sendJson(req, res, cache.data)
      return
    }
    throw new AppError(502, 'GitHub is unavailable')
  } finally {
    pending = null
  }
})
