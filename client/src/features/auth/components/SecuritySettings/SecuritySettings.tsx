import {userApi} from "@/entities/user"
import {PASSWORD_MIN, useSecuritySettings} from "../../utils/useSecuritySettings.ts"
import {PasskeyIcon} from "../PasskeyIcon/PasskeyIcon.tsx"
import {useTranslation} from "react-i18next"
import clsx from "clsx"
import securitySettingsStyles from './securitySettings.module.sass'


/**
 * Содержимое настроек входа: пароль и ключи доступа (показывается в модальном окне)
 */
export function SecuritySettings() {
  const { t } = useTranslation()
  const { data: user } = userApi.useMe()
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
    <div className={securitySettingsStyles.container}>
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
            aria-label={t('security.current-password')}
            autoComplete="current-password"
          />
        )}
        <input
          className={securitySettingsStyles.input}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('auth.form.password-new-placeholder', { count: PASSWORD_MIN })}
          aria-label={t('auth.form.password')}
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
        <p
          className={notice.kind === 'error' ? securitySettingsStyles.error : securitySettingsStyles.success}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {t(notice.key)}
        </p>
      )}
    </div>
  )
}
