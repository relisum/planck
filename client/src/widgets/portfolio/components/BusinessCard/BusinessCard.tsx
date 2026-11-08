import { useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ToggleTheme } from '@/shared/components/toggleTheme/ToggleTheme.tsx'
import { GITHUB_USER } from '../../model/projects'
import { CV_URL, EMAIL, SITE } from '../../model/resume'
import { LanguageSwitch } from '../LanguageSwitch/LanguageSwitch'
import cardStyles from './businessCard.module.sass'


// Скрытая страница /hire (/cv): визитка, которая переворачивается по клику
export function BusinessCard() {
  const { t } = useTranslation()
  const [flipped, setFlipped] = useState(false)

  return (
    <div className={cardStyles.page}>
      <title>{`${t('portfolio.card.title')} | ${t('portfolio.profile.name')}`}</title>
      <div className={cardStyles.controls}>
        <LanguageSwitch />
        <ToggleTheme />
      </div>

      <button
        type="button"
        className={clsx(cardStyles.card, flipped && cardStyles.flipped)}
        onClick={() => setFlipped(value => !value)}
        aria-label={t('portfolio.card.flip')}
      >
        <div className={cardStyles.inner}>
          <div className={cardStyles.front}>
            <img src={`https://github.com/${GITHUB_USER}.png`} alt="" width={72} height={72} />
            <div>
              <h1>{t('portfolio.profile.name')}</h1>
              <p>{t('portfolio.profile.bio')}</p>
              <p className={cardStyles.status}><i />{t('portfolio.profile.status')}</p>
            </div>
          </div>
          <div className={cardStyles.back}>
            <dl>
              <dt>Email</dt><dd>{EMAIL}</dd>
              <dt>GitHub</dt><dd>github.com/{GITHUB_USER}</dd>
              <dt>Web</dt><dd>{SITE}</dd>
              <dt>📍</dt><dd>{t('portfolio.profile.location')}</dd>
            </dl>
          </div>
        </div>
      </button>
      <p className={cardStyles.hint}>{t('portfolio.card.flip')}</p>

      <div className={cardStyles.actions}>
        <a href={`mailto:${EMAIL}`} className={cardStyles.primary}>{t('portfolio.profile.write')}</a>
        <a href={CV_URL} download className={cardStyles.button}>{t('portfolio.profile.cv')}</a>
        <Link to="/" className={cardStyles.button}>{t('portfolio.card.back')}</Link>
      </div>
    </div>
  )
}
