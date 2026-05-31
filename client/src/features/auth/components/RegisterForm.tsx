import {useState} from 'react'
import {PasskeyIcon} from "@/features/auth/components/PasskeyIcon.tsx"
import {useAuth} from "@/features/auth/utils/useAuth.ts"


export function RegisterForm() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { registerWithPasskey, isLoading, error } = useAuth()

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
      <div className="auth-field">
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
        className="auth-passkey-btn"
        onClick={() => registerWithPasskey(username, displayName)}
        disabled={!username || isLoading}
      >
        <PasskeyIcon />
        Create passkey
      </button>
      {error && <p className="auth-error">{error}</p>}
      <p className="auth-hint">A passkey is stored on your device — no password needed.</p>
    </div>
  )
}