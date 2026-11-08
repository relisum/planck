import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'
import type { GithubProfile } from '@/entities/github'
import { GITHUB_USER, STACK, languageColor } from '../../model/projects'
import { AGE, CV_URL, EMAIL } from '../../model/resume'
import { prefersReducedMotion } from '../../utils/useInView'
import profileStyles from './profileCard.module.sass'


interface ProfileCardProps {
  profile: GithubProfile | null
  languages: { name: string; share: number }[]
}

const EGG_CLICKS = 5

export function ProfileCard({ profile, languages }: ProfileCardProps) {
  const { t } = useTranslation()
  const githubUrl = profile?.htmlUrl ?? `https://github.com/${GITHUB_USER}`

  // Пасхалка: пять кликов по аватару — переворот и приветствие по-сербски
  const avatarRef = useRef<HTMLImageElement>(null)
  const clicks = useRef(0)
  const [greeting, setGreeting] = useState(false)

  function handleAvatarClick() {
    clicks.current++
    if (clicks.current < EGG_CLICKS || greeting) return
    clicks.current = 0
    setGreeting(true)
    if (avatarRef.current && !prefersReducedMotion()) {
      gsap.fromTo(avatarRef.current, { rotationY: 0 }, { rotationY: 360, duration: 0.9, ease: 'power2.inOut' })
    }
    setTimeout(() => setGreeting(false), 3000)
  }

  return (
    <aside className={profileStyles.card} data-reveal>
      <div className={profileStyles.avatarWrap}>
        <img
          ref={avatarRef}
          className={profileStyles.avatar}
          src={profile?.avatarUrl ?? `https://github.com/${GITHUB_USER}.png`}
          alt={t('portfolio.profile.name')}
          width={260}
          height={260}
          onClick={handleAvatarClick}
        />
        <span className={profileStyles.status}>
          <i className={profileStyles.statusDot} />
          {greeting ? t('portfolio.profile.status-egg') : t('portfolio.profile.status')}
        </span>
      </div>

      <div className={profileStyles.names}>
        <h2>{t('portfolio.profile.name')}</h2>
        <span className={profileStyles.login}>{GITHUB_USER} · {t('portfolio.profile.age', { count: AGE })}</span>
      </div>

      <p className={profileStyles.bio}>{t('portfolio.profile.bio')}</p>

      <div className={profileStyles.buttons}>
        <a href={`mailto:${EMAIL}`} className={profileStyles.primary}>{t('portfolio.profile.write')}</a>
        <a href={CV_URL} download className={profileStyles.button} title={t('portfolio.profile.cv-title')}>{t('portfolio.profile.cv')}</a>
        <a href={githubUrl} target="_blank" rel="noreferrer" className={profileStyles.button}>{t('portfolio.profile.github')}</a>
      </div>

      <ul className={profileStyles.meta}>
        <li>
          <Icon d="M8 0a5.5 5.5 0 0 1 5.5 5.5c0 4.13-4.73 9.6-5.13 10.06a.5.5 0 0 1-.74 0C7.23 15.1 2.5 9.63 2.5 5.5A5.5 5.5 0 0 1 8 0Zm0 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
          {t('portfolio.profile.location')}
        </li>
        <li>
          <Icon d="M1.75 2h12.5c.97 0 1.75.78 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.78.78 2 1.75 2ZM1.5 5.06v7.19c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.06L8.4 9.2a.75.75 0 0 1-.8 0Zm13-1.31v-.03a.25.25 0 0 0-.25-.22H1.75a.25.25 0 0 0-.25.22v.03L8 7.7Z" />
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </li>
        <li>
          <Icon d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.36 4.98c.27.02.56.02.86 0a9.64 9.64 0 0 0 1.36-4.98Zm4.08 0a11.1 11.1 0 0 1-.97 4.53 6.5 6.5 0 0 0 4.57-4.53Zm-8.33 0a6.5 6.5 0 0 0 4.57 4.53 11.1 11.1 0 0 1-.97-4.53Zm4.25-6.03A6.5 6.5 0 0 0 1.53 7.25h3.61a11.1 11.1 0 0 1 .97-4.53Zm1.33-.45a9.64 9.64 0 0 0-1.36 4.98h4.5a9.64 9.64 0 0 0-1.36-4.98 7 7 0 0 0-1.78 0Zm2.78.45c.62 1.4.94 2.95.97 4.53h3.61a6.5 6.5 0 0 0-4.58-4.53Z" />
          {t('portfolio.profile.languages')}
        </li>
        {profile && (
          <li className={profileStyles.github}>
            {t('portfolio.profile.followers', { count: profile.followers })} · {t('portfolio.profile.following', { count: profile.following })}
            {' · '}{t('portfolio.profile.since', { year: new Date(profile.createdAt).getFullYear() })}
          </li>
        )}
      </ul>

      <div className={profileStyles.block}>
        <h3 className={profileStyles.label}>{t('portfolio.profile.stack')}</h3>
        <div className={profileStyles.chips}>
          {STACK.map(item => <span key={item} className={profileStyles.chip}>{item}</span>)}
        </div>
      </div>

      {languages.length > 0 && (
        <div className={profileStyles.block}>
          <h3 className={profileStyles.label}>{t('portfolio.languages')}</h3>
          <div className={profileStyles.bar}>
            {languages.map(lang => (
              <span
                key={lang.name}
                style={{ width: `${lang.share * 100}%`, backgroundColor: languageColor(lang.name) }}
                title={`${lang.name} ${(lang.share * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <ul className={profileStyles.legend}>
            {languages.slice(0, 6).map(lang => (
              <li key={lang.name}>
                <i style={{ backgroundColor: languageColor(lang.name) }} />
                {lang.name}
                <span>{(lang.share * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d={d} />
    </svg>
  )
}
