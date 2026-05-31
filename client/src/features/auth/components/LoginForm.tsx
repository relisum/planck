import { useState } from 'react'
import {useAuth} from "@/features/auth/utils/useAuth.ts";
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon.tsx";


export function LoginForm() {
  const [username, setUsername] = useState('')
  const { loginWithPasskey, isLoading, error } = useAuth()

  return (
    <div className="auth-form">
      <div className="auth-field">
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
        className="auth-passkey-btn"
        onClick={() => loginWithPasskey(username)}
        disabled={!username || isLoading}
      >
        <PasskeyIcon />
        Sign in with passkey
      </button>
      {error && <p className="auth-error">{error}</p>}
      <p className="auth-hint">Use your device biometrics or security key.</p>
    </div>
  )
}