import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import backLinkStyles from './backLink.module.sass'


// Возврат в портфолио со служебных страниц (/hire, 404). Ведёт на «/», а не назад по истории:
// на такие страницы часто приходят по прямой ссылке
export function BackLink() {
  const { t } = useTranslation()

  return (
    <Link to="/" className={backLinkStyles.back}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path fill="currentColor" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
      </svg>
      {t('portfolio.back')}
    </Link>
  )
}
