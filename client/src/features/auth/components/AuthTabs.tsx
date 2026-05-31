type Tab = 'login' | 'register'

interface AuthTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function AuthTabs({ active, onChange }: AuthTabsProps) {
  return (
    <div className="auth-tabs">
      <button className={`auth-tab ${active === 'login' ? 'auth-tab--active' : ''}`} onClick={() => onChange('login')}>
        Sign in
      </button>
      <button className={`auth-tab ${active === 'register' ? 'auth-tab--active' : ''}`} onClick={() => onChange('register')}>
        Register
      </button>
    </div>
  )
}