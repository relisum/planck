import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Avatar } from '@/shared/components/avatar/Avatar.tsx'
import { ToggleTheme } from '@/shared/components/toggleTheme/ToggleTheme.tsx'
import { DASHBOARD_ROUTE, GITHUB_USER } from '../../model/projects'
import { CV_URL, EMAIL } from '../../model/resume'
import { greetInConsole } from '../../utils/greeting'
import { useKonami } from '../../utils/useKonami'
import { usePortfolio } from '../../utils/usePortfolio'
import { useReveal } from '../../utils/useReveal'
import { ProfileCard } from '../ProfileCard/ProfileCard'
import { Experience } from '../Experience/Experience'
import { RepoCard } from '../RepoCard/RepoCard'
import { LockedCard } from '../LockedCard/LockedCard'
import { ContributionGraph } from '../ContributionGraph/ContributionGraph'
import { ActivityFeed } from '../ActivityFeed/ActivityFeed'
import { SiteSpeed } from '../SiteSpeed/SiteSpeed'
import { LastCommit } from '../LastCommit/LastCommit'
import { LanguageSwitch } from '../LanguageSwitch/LanguageSwitch'
import { CommandPalette } from '../CommandPalette/CommandPalette'
import portfolioStyles from './portfolio.module.sass'


export function Portfolio() {
  const { t } = useTranslation()
  const portfolio = usePortfolio()
  const rootRef = useRef<HTMLDivElement>(null)
  const [egg, setEgg] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

  useReveal(rootRef, [portfolio.isLoading])
  useKonami(() => setEgg(value => !value))
  useEffect(greetInConsole, [])

  // ⌘K / Ctrl+K открывает и закрывает командную палитру
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={portfolioStyles.page} ref={rootRef}>
      <title>{t('portfolio.title')}</title>

      <header className={portfolioStyles.header}>
        <a href="#overview" className={portfolioStyles.logo}>
          <Avatar id={GITHUB_USER} name={GITHUB_USER} />
          {GITHUB_USER}
        </a>
        <nav className={portfolioStyles.nav}>
          <a href="#overview">{t('portfolio.nav.overview')}</a>
          <a href="#experience">{t('portfolio.nav.experience')}</a>
          <a href="#projects">{t('portfolio.nav.projects')}</a>
          <a href="#activity">{t('portfolio.nav.activity')}</a>
        </nav>
        <div className={portfolioStyles.actions}>
          <button type="button" className={portfolioStyles.search} onClick={() => setPaletteOpen(true)} aria-label={t('portfolio.palette.open')}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path fill="currentColor" d="M10.68 11.74a6 6 0 0 1-7.92-8.98 6 6 0 0 1 8.98 7.92l3.04 3.04a.75.75 0 0 1-1.06 1.06ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
            </svg>
            <span>{t('portfolio.palette.hint')}</span>
            <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <LanguageSwitch />
          <ToggleTheme />
          <Link to={DASHBOARD_ROUTE} className={portfolioStyles.cta}>{t('portfolio.nav.open-planck')}</Link>
        </div>
      </header>

      <div className={portfolioStyles.layout}>
        <ProfileCard profile={portfolio.profile} languages={portfolio.languages} />

        <div className={portfolioStyles.content}>
          {portfolio.isError && <p className={portfolioStyles.error}>{t('portfolio.error')}</p>}

          <section id="overview" className={portfolioStyles.section}>
            <div className={portfolioStyles.readme} data-reveal>
              <div className={portfolioStyles.readmeHead}>
                {GITHUB_USER} / <b>README</b>.md
              </div>
              <div className={portfolioStyles.readmeBody}>
                <p className={portfolioStyles.open}>
                  <i />
                  {t('portfolio.readme.open')}
                </p>
                <h1>{t('portfolio.readme.hello')}</h1>
                <p><Trans i18nKey="portfolio.readme.about" components={{ site: <a href="https://edusite.ru" target="_blank" rel="noreferrer" /> }} /></p>
                <p>{t('portfolio.readme.focus')}</p>
                <p><Trans i18nKey="portfolio.readme.now" components={{ b: <b /> }} /></p>
                <div className={portfolioStyles.readmeActions}>
                  <a href={`mailto:${EMAIL}`} className={portfolioStyles.primary}>{t('portfolio.readme.contact')}</a>
                  <a href={CV_URL} download className={portfolioStyles.ghost}>{t('portfolio.readme.cv')}</a>
                  <Link to={DASHBOARD_ROUTE} className={portfolioStyles.ghost}>{t('portfolio.readme.try')}</Link>
                </div>
              </div>
              <div className={portfolioStyles.readmeFoot}>
                <LastCommit events={portfolio.events} />
              </div>
            </div>
          </section>

          <section id="experience" className={portfolioStyles.section}>
            <h2 className={portfolioStyles.label} data-reveal>{t('portfolio.experience.title')}</h2>
            <Experience />
          </section>

          <section id="projects" className={portfolioStyles.section}>
            <h2 className={portfolioStyles.label} data-reveal>{t('portfolio.projects.title')}</h2>
            <div className={portfolioStyles.grid}>
              {portfolio.projects.map(project => (
                <RepoCard key={project.name} project={project} />
              ))}
              <LockedCard />
            </div>
          </section>

          <section id="activity" className={portfolioStyles.section}>
            <h2 className={portfolioStyles.label} data-reveal>{t('portfolio.activity.title')}</h2>
            <SiteSpeed />
            <ContributionGraph days={portfolio.contributions} streaks={portfolio.streaks} isLoading={portfolio.isLoading} egg={egg} />
            <ActivityFeed events={portfolio.events} isLoading={portfolio.isLoading} />
          </section>

          <footer className={portfolioStyles.footer}>
            <span>{t('portfolio.footer', { year: new Date().getFullYear() })}</span>
            <span className={portfolioStyles.hint}>{t('portfolio.footer-hint')}</span>
          </footer>
        </div>
      </div>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
