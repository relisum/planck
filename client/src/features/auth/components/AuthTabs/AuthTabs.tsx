import authTabsStyles from './authTabs.module.sass'
import clsx from 'clsx'
import {useTranslation} from "react-i18next";


type Tab = 'login' | 'register'

interface AuthTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function AuthTabs({ active, onChange }: AuthTabsProps) {
  const { t } = useTranslation()

  return (
    <div className={authTabsStyles.container}>
      <button
        className={clsx(
          authTabsStyles.tab,
          active === 'login' ? authTabsStyles.tabActive : ''
        )}
        onClick={() => onChange('login')}
      >
        {t('auth.sign-in')}
      </button>
      <button
        className={clsx(
          authTabsStyles.tab,
          active === 'register' ? authTabsStyles.tabActive : ''
        )}
        onClick={() => onChange('register')}>
        {t('auth.register')}
      </button>
    </div>
  )
}