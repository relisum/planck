import type { User } from '@/entities/user'

interface SidebarFooterProps {
  user: User | null
  onLogout: () => void
}

export function SidebarFooter({ user, onLogout }: SidebarFooterProps) {
  if (!user) return null

  return (
    <div className="sidebar__footer">
      <div className="sidebar__user">
        <div className="sidebar__user-avatar">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <span className="sidebar__user-name">{user.displayName}</span>
      </div>
      <button className="sidebar__logout" onClick={onLogout} aria-label="Выйти">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  )
}