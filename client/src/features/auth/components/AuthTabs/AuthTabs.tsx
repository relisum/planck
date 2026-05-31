import authTabsStyles from './authTabs.module.sass'
import clsx from 'clsx'


type Tab = 'login' | 'register'

interface AuthTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function AuthTabs({ active, onChange }: AuthTabsProps) {
  return (
    <div className={authTabsStyles.container}>
      <button
        className={clsx(
          authTabsStyles.tab,
          active === 'register' ? authTabsStyles.tabActive : ''
        )}
        onClick={() => onChange('login')}
      >
        Sign in
      </button>
      <button
        className={clsx(
          authTabsStyles.tab,
          active === 'register' ? authTabsStyles.tabActive : ''
        )}
        onClick={() => onChange('register')}>
        Register
      </button>
    </div>
  )
}