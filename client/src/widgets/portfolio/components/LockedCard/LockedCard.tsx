import { useTranslation } from 'react-i18next'
import { EMAIL } from '../../model/resume'
import lockedStyles from './lockedCard.module.sass'


// Ширины строк «размытого кода»
const LINES = [62, 48, 74, 35, 58, 80, 42]

// Пасхальная карточка: самые интересные проекты — коммерческие и закрытые
export function LockedCard() {
  const { t } = useTranslation()

  return (
    <article className={lockedStyles.card} data-reveal>
      <div className={lockedStyles.code} aria-hidden>
        {LINES.map((width, i) => (
          <span key={i} style={{ width: `${width}%`, marginLeft: `${(i % 3) * 6}%` }} />
        ))}
      </div>
      <div className={lockedStyles.text}>
        <div className={lockedStyles.head}>
          <svg className={lockedStyles.lock} viewBox="0 0 16 16" width="16" height="16" aria-hidden>
            <path fill="currentColor" d="M4 4a4 4 0 0 1 8 0v2h.25c.97 0 1.75.78 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.78 2.78 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z" />
          </svg>
          <span className={lockedStyles.name}>{t('portfolio.locked.name')}</span>
          <span className={lockedStyles.badge}>Private</span>
        </div>
        <p className={lockedStyles.title}>{t('portfolio.locked.title')}</p>
        <p className={lockedStyles.description}>{t('portfolio.locked.description')}</p>
        <a href={`mailto:${EMAIL}`} className={lockedStyles.link}>{t('portfolio.locked.ask')}</a>
      </div>
    </article>
  )
}
