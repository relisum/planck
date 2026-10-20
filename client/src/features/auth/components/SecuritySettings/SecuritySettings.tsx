import {userApi} from "@/entities/user"
import {usePopover} from "@/shared/lib/usePopover.ts"
import {PASSWORD_MIN, useSecuritySettings} from "../../utils/useSecuritySettings.ts"
import {PasskeyIcon} from "../PasskeyIcon/PasskeyIcon.tsx"
import {useTranslation} from "react-i18next"
import clsx from "clsx"
import securitySettingsStyles from './securitySettings.module.sass'


export function SecuritySettings() {
  const { t } = useTranslation()
  const { data: user } = userApi.useMe()
  const { isOpen, toggle, containerRef, popoverRef } = usePopover()
  const {
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    isSaving,
    isAddingPasskey,
    notice,
    isPasswordValid,
    handlePasswordSubmit,
    handleAddPasskey,
  } = useSecuritySettings()

  if (!user) return null

  return (
    <div className={securitySettingsStyles.container} ref={containerRef}>
      <button
        className={securitySettingsStyles.trigger}
        onClick={toggle}
        aria-label={t('security.title')}
        title={t('security.title')}
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="15.5" r="4.5"/>
          <path d="M10.7 12.3 21 2"/>
          <path d="m16 7 3 3"/>
          <path d="m19 4 2 2"/>
        </svg>
        {!user.hasPassword && <span className={securitySettingsStyles.badge} />}
      </button>

      {isOpen && (
        <div className={securitySettingsStyles.popover} ref={popoverRef} role="dialog" aria-label={t('security.title')}>
          <form className={securitySettingsStyles.section} onSubmit={handlePasswordSubmit}>
            <span className={securitySettingsStyles.title}>
              {user.hasPassword ? t('security.change-password') : t('security.set-password')}
            </span>
            {!user.hasPassword && <p className={securitySettingsStyles.hint}>{t('security.password-hint')}</p>}

            {user.hasPassword && (
              <input
                className={securitySettingsStyles.input}
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder={t('security.current-password')}
                autoComplete="current-password"
              />
            )}
            <input
              className={securitySettingsStyles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.form.password-new-placeholder', { count: PASSWORD_MIN })}
              autoComplete="new-password"
            />

            <button
              className={securitySettingsStyles.button}
              type="submit"
              disabled={!isPasswordValid || (user.hasPassword && !currentPassword) || isSaving}
            >
              {t('security.save')}
            </button>
          </form>

          <div className={securitySettingsStyles.section}>
            <div className={securitySettingsStyles.row}>
              <span className={securitySettingsStyles.title}>{t('security.passkeys')}</span>
              <span className={securitySettingsStyles.count}>{user.passkeys}</span>
            </div>
            <p className={securitySettingsStyles.hint}>{t('security.passkey-hint')}</p>
            <button
              className={clsx(securitySettingsStyles.button, securitySettingsStyles.passkey)}
              onClick={handleAddPasskey}
              disabled={isAddingPasskey}
            >
              <PasskeyIcon />
              {t('security.add-passkey')}
            </button>
          </div>

          {notice && (
            <p className={notice.kind === 'error' ? securitySettingsStyles.error : securitySettingsStyles.success}>
              {t(notice.key)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
