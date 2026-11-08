export interface GithubProfile {
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

export interface GithubRepo {
  name: string
  description: string | null
  htmlUrl: string
  homepage: string | null
  language: string | null
  languages: Record<string, number>
  stars: number
  pushedAt: string
}

export interface ContributionDay {
  date: string
  level: number
  count: number
}

export interface GithubEvent {
  type: string
  repo: string
  createdAt: string
  commitCount: number
  commits: string[]
}

export interface GithubData {
  profile: GithubProfile
  repos: GithubRepo[]
  contributions: ContributionDay[]
  events: GithubEvent[]
  fetchedAt: string
}
