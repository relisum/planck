import {useId, useState} from 'react'
import * as React from "react"
import {useAuth} from "@/features/auth"
import registerFormStyles from '@/shared/styles/authForm.module.sass'
import {useTranslation} from "react-i18next";


const PASSWORD_MIN = 8

export function RegisterForm() {
  const { t } = useTranslation()
  const id = useId()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const { registerWithPassword, isLoading, error } = useAuth()

  const isPasswordValid = password.length >= PASSWORD_MIN

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !isPasswordValid || isLoading) return
    registerWithPassword(username, displayName, password)
  }

  return (
    <form className={registerFormStyles.container} onSubmit={handleSubmit}>
      <div className={registerFormStyles.field}>
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
      <div className={registerFormStyles.field}>
        <label htmlFor={`${id}-display-name`}>{t('auth.form.display-name')}</label>
        <input
          id={`${id}-display-name`}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder={t('auth.form.display-name-placeholder')}
          autoComplete="nickname"
          name="planck-name"
        />
      </div>
      <div className={registerFormStyles.field}>
        <label htmlFor={`${id}-password`}>{t('auth.form.password')}</label>
        <input
          id={`${id}-password`}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('auth.form.password-new-placeholder', { count: PASSWORD_MIN })}
          autoComplete="new-password"
          name="new-password"
        />
      </div>
      <button
        className={registerFormStyles.primaryBtn}
        type="submit"
        disabled={!username || !isPasswordValid || isLoading}
      >
        {t('auth.form.password-register')}
      </button>
      {error && <p className={registerFormStyles.error}>{error}</p>}
      <p className={registerFormStyles.hint}>{t('auth.form.hint-register')}</p>
    </form>
  )
}
