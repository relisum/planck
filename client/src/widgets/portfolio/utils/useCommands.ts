import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toggleTheme } from '@/shared/lib/useTheme'
import { setLanguage } from '@/shared/lib/language'
import { GITHUB_USER } from '../model/projects'
import { CV_URL, EMAIL } from '../model/resume'

export type CommandGroup = 'navigate' | 'actions' | 'links'

export interface Command {
  id: string
  group: CommandGroup
  label: string
  // Дополнительные слова для поиска на обоих языках
  keywords: string
  run: () => void | 'copied'
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function download(url: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = ''
  link.click()
}

export function useCommands(dashboardLink: string) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return useMemo<Command[]>(() => {
    const item = (id: string) => t(`portfolio.palette.items.${id}`)
    return [
      { id: 'overview', group: 'navigate', label: item('overview'), keywords: 'overview readme обзор', run: () => scrollToSection('overview') },
      { id: 'experience', group: 'navigate', label: item('experience'), keywords: 'experience work опыт работа', run: () => scrollToSection('experience') },
      { id: 'projects', group: 'navigate', label: item('projects'), keywords: 'projects repos проекты', run: () => scrollToSection('projects') },
      { id: 'activity', group: 'navigate', label: item('activity'), keywords: 'activity contributions активность', run: () => scrollToSection('activity') },
      {
        id: 'copy-email', group: 'actions', label: item('copy-email'), keywords: 'email mail copy почта копировать',
        run: () => { void navigator.clipboard?.writeText(EMAIL); return 'copied' },
      },
      { id: 'write', group: 'actions', label: item('write'), keywords: 'email mail write почта письмо', run: () => { location.href = `mailto:${EMAIL}` } },
      { id: 'cv', group: 'actions', label: item('cv'), keywords: 'cv resume pdf резюме', run: () => download(CV_URL) },
      { id: 'theme', group: 'actions', label: item('theme'), keywords: 'theme dark light тема тёмная светлая', run: toggleTheme },
      {
        id: 'lang', group: 'actions', label: item('lang'), keywords: 'language english russian язык',
        run: () => { void setLanguage(i18n.language === 'ru' ? 'en' : 'ru') },
      },
      { id: 'planck', group: 'links', label: item('planck'), keywords: 'planck dashboard kanban трекер', run: () => { void navigate(dashboardLink) } },
      { id: 'github', group: 'links', label: item('github'), keywords: 'github code код', run: () => { window.open(`https://github.com/${GITHUB_USER}`, '_blank', 'noreferrer') } },
      { id: 'card', group: 'links', label: item('card'), keywords: 'card hire contacts визитка контакты', run: () => { void navigate('/hire') } },
    ]
  }, [t, i18n.language, navigate, dashboardLink])
}
