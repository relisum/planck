export interface LighthouseReport {
  url: string
  scores: Record<string, number>
  lcp: string | null
  cls: string | null
  fetchedAt: string
}
