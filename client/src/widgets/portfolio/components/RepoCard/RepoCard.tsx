import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languageColor, type ProjectMeta } from '../../model/projects'
import { formatRelative } from '../../utils/format'
import { prefersReducedMotion, useInView } from '../../utils/useInView'
import type { Project } from '../../utils/usePortfolio'
import { Gauge } from '../Gauge/Gauge'
import repoStyles from './repoCard.module.sass'


export function RepoCard({ project }: { project: Project }) {
  const { t, i18n } = useTranslation()
  const { repo } = project
  const description = t(`portfolio.projects.${project.name}`, { defaultValue: repo?.description ?? '' })
  const title = project.title ?? project.name

  const badge = project.route
    ? t('portfolio.projects.live')
    : project.closed ? t('portfolio.projects.closed') : 'Public'

  return (
    <article className={clsx(repoStyles.card, project.route && repoStyles.featured)} data-reveal>
      <div className={repoStyles.head}>
        <svg className={repoStyles.icon} viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
        </svg>
        {project.htmlUrl
          ? <a href={project.htmlUrl} target="_blank" rel="noreferrer" className={repoStyles.name}>{title}</a>
          : <span className={repoStyles.name}>{title}</span>}
        <span className={clsx(repoStyles.badge, project.route && repoStyles.live)}>
          {project.route && <i className={repoStyles.liveDot} />}
          {badge}
        </span>
      </div>

      {project.route ? (
        <div className={repoStyles.showcase}>
          <BoardPreview />
          <div className={repoStyles.showcaseText}>
            {description && <p className={repoStyles.description}>{description}</p>}
            <ul className={repoStyles.facts}>
              {(t(`portfolio.projects.${project.name}-facts`, { returnObjects: true, defaultValue: [] }) as string[]).map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        description && <p className={repoStyles.description}>{description}</p>
      )}

      {project.lighthouse && <Lighthouse scores={project.lighthouse} />}

      {project.stack.length > 0 && (
        <div className={repoStyles.stack}>
          {project.stack.map(item => <span key={item}>{item}</span>)}
        </div>
      )}

      <div className={repoStyles.footer}>
        {repo?.language && (
          <span className={repoStyles.lang}>
            <i style={{ backgroundColor: languageColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        {!!repo?.stars && <span>★ {repo.stars}</span>}
        {repo && <span>{t('portfolio.projects.updated', { when: formatRelative(repo.pushedAt, i18n.language) })}</span>}

        {(project.htmlUrl || project.route) && (
          <div className={repoStyles.links}>
            {project.htmlUrl && <a href={project.htmlUrl} target="_blank" rel="noreferrer">{t('portfolio.projects.source')}</a>}
            {project.route && <Link to={project.route} className={repoStyles.open}>{t('portfolio.projects.open')}</Link>}
          </div>
        )}
      </div>
    </article>
  )
}

// Мини-доска Planck: задачи один раз раскладываются по колонкам, когда карточка показалась на экране
const PREVIEW_COLUMNS: { w: number; p: number; done?: boolean }[][] = [
  [{ w: 80, p: 0 }, { w: 60, p: 1 }, { w: 70, p: 2 }],
  [{ w: 65, p: 1 }, { w: 85, p: 0 }],
  [{ w: 75, p: 2, done: true }, { w: 55, p: 0, done: true }],
]

function BoardPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.5)

  useEffect(() => {
    const el = ref.current
    if (!el || !inView || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.timeline()
        .fromTo('[data-task]', { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.07 })
        .fromTo('[data-check]', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', stagger: 0.1 }, '-=0.1')
    }, el)
    return () => ctx.revert()
  }, [inView])

  return (
    // Пока анимация не сыграла, задачи скрыты, чтобы не мигали
    <div className={repoStyles.preview} ref={ref} data-pending={!prefersReducedMotion() || undefined} aria-hidden>
      {PREVIEW_COLUMNS.map((tasks, column) => (
        <div key={column} className={repoStyles.previewColumn}>
          <span className={repoStyles.previewTitle} />
          {tasks.map((task, i) => (
            <span key={i} className={repoStyles.previewTask} data-task data-priority={task.p}>
              {task.done && <i className={repoStyles.previewCheck} data-check />}
              <span style={{ width: `${task.w}%` }} />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

const LIGHTHOUSE_KEYS = ['performance', 'accessibility', 'bestPractices'] as const

// Кольца Lighthouse заполняются до результата при появлении на экране
function Lighthouse({ scores }: { scores: NonNullable<ProjectMeta['lighthouse']> }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.6)

  return (
    <div className={repoStyles.lighthouse} ref={ref}>
      {LIGHTHOUSE_KEYS.map(key => (
        <Gauge key={key} value={scores[key]} label={t(`portfolio.projects.lighthouse.${key}`)} filled={inView} />
      ))}
    </div>
  )
}
