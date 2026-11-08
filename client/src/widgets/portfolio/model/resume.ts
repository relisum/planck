// Данные из резюме, которые не переводятся: даты, числа, ссылки.
// Тексты — в i18n (portfolio.about, portfolio.experience, portfolio.highlights)
export const FULL_NAME = 'Roman Bastrykin'
export const AGE = 20
export const EMAIL = 'rel_daisy@icloud.com'
export const SITE = 'plancktask.site'

export interface Experience {
  id: string
  company: string
  url?: string
  from: string
  to: string | null
  stack: string[]
}

export const EXPERIENCE: Experience[] = [
  {
    id: 'epublish',
    company: 'E-Publish JSC',
    url: 'https://edusite.ru',
    from: '2023-06',
    to: '2026-06',
    stack: ['React', 'TypeScript', 'GrapesJS', 'XSLT', 'Docker', 'GitLab CI', 'Yandex Metrica'],
  },
]

export const EDUCATION = { id: 'mit', from: '2023-09', to: null }

export const CV_URL = '/Roman_Bastrykin_CV.pdf'
