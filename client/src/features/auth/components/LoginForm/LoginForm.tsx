import { useState } from 'react'
import {useAuth} from "@/features/auth/utils/useAuth.ts"
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon/PasskeyIcon.tsx"
import loginFormStyles from '@/shared/styles/authForm.module.sass'


export function LoginForm() {
  const [username, setUsername] = useState('')
  const { loginWithPasskey, isLoading, error } = useAuth()

  return (
    <div className={loginFormStyles.container}>
      <div className={loginFormStyles.field}>
        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="your-username"
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
        Sign in with passkey
      </button>
      {error && <p className={loginFormStyles.error}>{error}</p>}
      <p className={loginFormStyles.hint}>Use your device biometrics or security key.</p>
    </div>
  )
}