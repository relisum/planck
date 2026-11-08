import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '@/shared/lib/language'
import switchStyles from './languageSwitch.module.sass'


export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <div className={switchStyles.switch} role="group" aria-label={t('portfolio.lang.switch')}>
      {LANGUAGES.map(lng => (
        <button
          key={lng}
          type="button"
          className={clsx(switchStyles.option, i18n.language === lng && switchStyles.active)}
          aria-pressed={i18n.language === lng}
          onClick={() => setLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
