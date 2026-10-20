import {useState} from "react"
import {userApi} from "@/entities/user"
import {SecuritySettings} from "@/features/auth"
import {Modal} from "@/shared/components/modal/Modal.tsx"
import {usePopover} from "@/shared/lib/usePopover.ts"
import {useTranslation} from "react-i18next"
import settingsMenuStyles from './settingsMenu.module.sass'


export function SettingsMenu() {
  const { t } = useTranslation()
  const { data: user } = userApi.useMe()
  const { isOpen, toggle, close, containerRef, popoverRef } = usePopover()
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)

  if (!user) return null

  const needsPassword = !user.hasPassword

  function openSecurity() {
    close()
    setIsSecurityOpen(true)
  }

  return (
    <div className={settingsMenuStyles.container} ref={containerRef}>
      <button
        className={settingsMenuStyles.trigger}
        onClick={toggle}
        aria-label={t('settings.title')}
        title={t('settings.title')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        {needsPassword && <span className={settingsMenuStyles.badge} />}
      </button>

      {isOpen && (
        <div className={settingsMenuStyles.popover} ref={popoverRef} role="menu" aria-label={t('settings.title')}>
          <span className={settingsMenuStyles.title}>{t('settings.title')}</span>
          <button className={settingsMenuStyles.item} role="menuitem" onClick={openSecurity}>
            <span className={settingsMenuStyles.itemIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="4.5"/>
                <path d="M10.7 12.3 21 2"/>
                <path d="m16 7 3 3"/>
                <path d="m19 4 2 2"/>
              </svg>
            </span>
            <span className={settingsMenuStyles.itemText}>
              <span className={settingsMenuStyles.itemLabel}>{t('security.title')}</span>
              <span className={settingsMenuStyles.itemHint}>
                {needsPassword ? t('settings.sign-in-hint-no-password') : t('settings.sign-in-hint')}
              </span>
            </span>
            {needsPassword && <span className={settingsMenuStyles.itemBadge} />}
          </button>
        </div>
      )}

      <Modal isOpen={isSecurityOpen} title={t('security.title')} onClose={() => setIsSecurityOpen(false)}>
        <SecuritySettings />
      </Modal>
    </div>
  )
}
