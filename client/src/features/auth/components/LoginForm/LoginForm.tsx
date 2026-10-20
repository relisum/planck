import { useId, useState } from 'react'
import * as React from "react"
import {useAuth} from "@/features/auth/utils/useAuth.ts"
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon/PasskeyIcon.tsx"
import loginFormStyles from '@/shared/styles/authForm.module.sass'
import {useTranslation} from "react-i18next";


export function LoginForm() {
  const { t } = useTranslation()
  const id = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { loginWithPasskey, loginWithPassword, isLoading, error } = useAuth()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password || isLoading) return
    loginWithPassword(username, password)
  }

  return (
    <form className={loginFormStyles.container} onSubmit={handleSubmit}>
      <div className={loginFormStyles.field}>
        <label htmlFor={`${id}-username`}>{t('auth.form.username')}</label>
        <input
          id={`${id}-username`}
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={t('auth.form.username-placeholder')}
          autoComplete="username"
          name="username"
        />
      </div>
      <div className={loginFormStyles.field}>
        <label htmlFor={`${id}-password`}>{t('auth.form.password')}</label>
        <input
          id={`${id}-password`}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('auth.form.password-placeholder')}
          autoComplete="current-password"
          name="password"
        />
      </div>
      <button
        className={loginFormStyles.primaryBtn}
        disabled={!username || !password || isLoading}
        type="submit"
      >
        {t('auth.form.password-sign-in')}
      </button>
      <div className={loginFormStyles.divider}>{t('auth.form.or')}</div>
      <button
        className={loginFormStyles.passkeyBtn}
        disabled={!username || isLoading}
        onClick={() => loginWithPasskey(username)}
        type="button"
      >
        <PasskeyIcon />
        {t('auth.form.passkey-sign-in')}
      </button>
      {error && <p className={loginFormStyles.error}>{error}</p>}
      <p className={loginFormStyles.hint}>{t('auth.form.hint-sign-in')}</p>
    </form>
  )
}
