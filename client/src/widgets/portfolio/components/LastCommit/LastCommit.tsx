import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'
import type { GithubEvent } from '@/entities/github'
import { GITHUB_USER } from '../../model/projects'
import { formatRelative } from '../../utils/format'
import { prefersReducedMotion, useInView } from '../../utils/useInView'
import lastCommitStyles from './lastCommit.module.sass'


// Последний запушенный коммит; сообщение «печатается» один раз, когда строка показалась на экране
export function LastCommit({ events }: { events: GithubEvent[] }) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLElement>(null)
  const inView = useInView(ref, 0.8)
  const push = events.find(e => e.type === 'PushEvent' && e.commits.length > 0)
  const message = push?.commits[0] ?? ''

  useEffect(() => {
    const el = messageRef.current
    if (!el || !inView || !message || prefersReducedMotion()) return
    const typed = { length: 0 }
    const tween = gsap.to(typed, {
      length: message.length,
      duration: Math.min(1.6, message.length * 0.03),
      ease: 'none',
      onUpdate: () => { el.textContent = message.slice(0, Math.round(typed.length)) },
    })
    return () => { tween.kill(); el.textContent = message }
  }, [inView, message])

  if (!push) return null

  return (
    <div className={lastCommitStyles.commit} ref={ref}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path fill="currentColor" d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
      </svg>
      <span className={lastCommitStyles.label}>{t('portfolio.commit.label')}</span>
      <code ref={messageRef} className={lastCommitStyles.message}>{inView || prefersReducedMotion() ? message : ''}</code>
      <span className={lastCommitStyles.meta}>
        {t('portfolio.commit.in')}{' '}
        <a href={`https://github.com/${GITHUB_USER}/${push.repo}`} target="_blank" rel="noreferrer">{push.repo}</a>
        {' · '}{formatRelative(push.createdAt, i18n.language)}
      </span>
    </div>
  )
}
