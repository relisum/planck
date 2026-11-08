import { useTranslation } from 'react-i18next'
import type { GithubEvent } from '@/entities/github'
import { GITHUB_USER } from '../../model/projects'
import { formatRelative } from '../../utils/format'
import feedStyles from './activityFeed.module.sass'


interface ActivityFeedProps {
  events: GithubEvent[]
  isLoading: boolean
}

export function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  const { t, i18n } = useTranslation()

  function describe(event: GithubEvent) {
    if (event.type === 'PushEvent') return t('portfolio.activity.push', { count: event.commitCount })
    if (event.type === 'CreateEvent') return t('portfolio.activity.create')
    return t('portfolio.activity.other')
  }

  if (isLoading) return null

  return (
    <div className={feedStyles.card} data-reveal>
      <h3 className={feedStyles.label}>{t('portfolio.activity.recent')}</h3>
      {events.length === 0 ? (
        <p className={feedStyles.empty}>{t('portfolio.activity.empty')}</p>
      ) : (
        <ol className={feedStyles.list}>
          {events.map((event, i) => (
            <li key={i} className={feedStyles.item}>
              <span className={feedStyles.dot} />
              <div className={feedStyles.body}>
                <p>
                  {describe(event)}{' '}
                  <a href={`https://github.com/${GITHUB_USER}/${event.repo}`} target="_blank" rel="noreferrer">{event.repo}</a>
                  <time>{formatRelative(event.createdAt, i18n.language)}</time>
                </p>
                {event.commits.length > 0 && (
                  <ul className={feedStyles.commits}>
                    {event.commits.map((message, j) => <li key={j}><code>{message}</code></li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
