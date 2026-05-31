import { useState } from 'react'
import {useAuth} from "@/features/auth/utils/useAuth.ts"
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon/PasskeyIcon.tsx"
import loginFormStyles from '@/shared/styles/authForm.module.sass'
import {useTranslation} from "react-i18next";


export function LoginForm() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const { loginWithPasskey, isLoading, error } = useAuth()

  return (
    <div className={loginFormStyles.container}>
      <div className={loginFormStyles.field}>
        <label>{t('auth.form.username')}</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={t('auth.form.username-placeholder')}
          autoComplete="planck-username"
          name="planck-username"
        />
      </div>
      <button
        className={loginFormStyles.passkeyBtn}
        onClick={() => loginWithPasskey(username)}
        disabled={!username || isLoading}
      >
        <PasskeyIcon />
        {t('auth.form.passkey-sign-in')}
      </button>
      {error && <p className={loginFormStyles.error}>{error}</p>}
      <p className={loginFormStyles.hint}>{t('auth.form.hint-sign-in')}</p>
    </div>
  )
}