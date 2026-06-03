import {useState} from 'react'
import {PasskeyIcon} from "../PasskeyIcon/PasskeyIcon.tsx"
import {useAuth} from "@/features/auth"
import registerFormStyles from '@/shared/styles/authForm.module.sass'
import {useTranslation} from "react-i18next";


export function RegisterForm() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { registerWithPasskey, isLoading, error } = useAuth()

  return (
    <div className={registerFormStyles.container}>
      <div className={registerFormStyles.field}>
        <label>{t('auth.form.username')}</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={t('auth.form.username-placeholder')}
          autoComplete="planck-username"
          name="planck-username"
        />
      </div>
      <div className={registerFormStyles.field}>
        <label>{t('auth.form.display-name')}</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder={t('auth.form.display-name-placeholder')}
          autoComplete="planck-name"
          name="planck-name"
        />
      </div>
      <button
        className={registerFormStyles.passkeyBtn}
        onClick={() => registerWithPasskey(username, displayName)}
        disabled={!username || isLoading}
      >
        <PasskeyIcon />
        {t('auth.form.passkey-register')}
      </button>
      {error && <p className={registerFormStyles.error}>{error}</p>}
      <p className={registerFormStyles.hint}>{t('auth.form.hint-register')}</p>
    </div>
  )
}