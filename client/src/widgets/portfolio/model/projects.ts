// Отобранные проекты: порядок, стек и ссылки, которых нет в GitHub API.
// Описания лежат в i18n (portfolio.projects.<name>)
export interface ProjectMeta {
  name: string
  title?: string
  stack: string[]
  // Внутренний маршрут, если проект живёт на этом же сайте
  route?: string
  // Закрытый проект: репозитория на GitHub нет
  closed?: boolean
  lighthouse?: { performance: number; accessibility: number; bestPractices: number }
}

export const GITHUB_USER = 'relisum'

// Аватар хранится локально в WebP нужных размеров (public/avatar): легче JPEG с GitHub и без похода на чужой домен
export type AvatarSize = 72 | 144 | 280 | 460
export const avatarUrl = (size: AvatarSize) => `/avatar/avatar-${size}.webp`

// Трекер сам отправит на /login, если сессии нет
export const DASHBOARD_ROUTE = '/dashboard'

export const PROJECTS: ProjectMeta[] = [
  { name: 'planck', stack: ['React 19', 'TypeScript', 'react-query', 'dnd-kit', 'GSAP', 'Express', 'Prisma', 'SSE'], route: DASHBOARD_ROUTE },
  {
    name: 'think-twice',
    title: 'Think Twice',
    stack: ['Next.js', 'Server Components', 'Tailwind', 'Figma'],
    closed: true,
    lighthouse: { performance: 93, accessibility: 94, bestPractices: 100 },
  },
  { name: 'serbiatrip', stack: ['Next.js', 'TypeScript', 'Tailwind'] },
  { name: 'news-from-telegram', stack: ['Next.js', 'Zustand', 'Tailwind', 'Zod', 'Telegram Bot API'] },
  { name: 'f1-tracker', stack: ['TypeScript', 'Electron', 'OOP'] },
]

export const STACK = ['TypeScript', 'React', 'Next.js', 'TanStack Query', 'Zustand', 'Sass', 'Tailwind', 'GSAP', 'Motion', 'dnd-kit', 'Vitest', 'Docker', 'Figma']

// Цвета языков как на GitHub — это данные, а не тема интерфейса
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Sass: '#a53b70',
  SCSS: '#c6538c',
  CSS: '#663399',
  HTML: '#e34c26',
  Shell: '#89e051',
  Perl: '#0298c3',
}

export const languageColor = (lang: string) => LANGUAGE_COLORS[lang] ?? '#8b949e'
