import {useState} from 'react'
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon/PasskeyIcon.tsx"
import {useAuth} from "@/features/auth/utils/useAuth.ts"
import registerFormStyles from '@/shared/styles/authForm.module.sass'


export function RegisterForm() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { registerWithPasskey, isLoading, error } = useAuth()

  return (
    <div className={registerFormStyles.container}>
      <div className={registerFormStyles.field}>
        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="your-username"
          autoComplete="planck-username"
          name="planck-username"
        />
      </div>
      <div className={registerFormStyles.field}>
        <label>Display name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your Name"
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
        Create passkey
      </button>
      {error && <p className={registerFormStyles.error}>{error}</p>}
      <p className={registerFormStyles.hint}>A passkey is stored on your device — no password needed.</p>
    </div>
  )
}