import { useMemo } from 'react'
import { githubApi, type ContributionDay, type GithubRepo } from '@/entities/github'
import { GITHUB_USER, PROJECTS, type ProjectMeta } from '../model/projects'

export interface Project extends ProjectMeta {
  repo: GithubRepo | null
  htmlUrl: string | null
}

export interface Streaks {
  total: number
  current: number
  longest: number
  best: ContributionDay | null
}

function countStreaks(days: ContributionDay[]): Streaks {
  let total = 0, longest = 0, run = 0
  let best: ContributionDay | null = null
  for (const day of days) {
    total += day.count
    run = day.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
    if (day.count > (best?.count ?? 0)) best = day
  }
  // Сегодняшний пустой день не обрывает текущую серию — день ещё не закончился
  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++
    else if (i !== days.length - 1) break
  }
  return { total, current, longest, best }
}

export function usePortfolio() {
  const { data, isLoading, isError } = githubApi.useGetProfile()

  const projects = useMemo<Project[]>(() => {
    const repos = data?.repos ?? []
    const curated = PROJECTS.map(meta => {
      const repo = repos.find(r => r.name === meta.name) ?? null
      const htmlUrl = meta.closed ? null : repo?.htmlUrl ?? `https://github.com/${GITHUB_USER}/${meta.name}`
      return { ...meta, repo, htmlUrl }
    })
    // Новые публичные репозитории появляются автоматически, после отобранных
    const rest = repos
      .filter(r => !PROJECTS.some(p => p.name === r.name))
      .map(repo => ({ name: repo.name, stack: [], repo, htmlUrl: repo.htmlUrl }))
    return [...curated, ...rest]
  }, [data])

  const languages = useMemo(() => {
    const totals = new Map<string, number>()
    for (const repo of data?.repos ?? []) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        totals.set(lang, (totals.get(lang) ?? 0) + bytes)
      }
    }
    const sum = [...totals.values()].reduce((a, b) => a + b, 0)
    return [...totals.entries()]
      .map(([name, bytes]) => ({ name, share: sum ? bytes / sum : 0 }))
      .sort((a, b) => b.share - a.share)
  }, [data])

  const contributions = data?.contributions ?? []
  const streaks = useMemo(() => countStreaks(contributions), [contributions])

  return {
    profile: data?.profile ?? null,
    projects,
    languages,
    contributions,
    streaks,
    events: data?.events ?? [],
    isLoading,
    isError,
  }
}
