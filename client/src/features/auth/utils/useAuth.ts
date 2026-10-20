import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { queryClient } from '@/shared/api/apiClient'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  authApi,
  type AuthUserResponse,
} from '@/entities/user'

const ERROR_KEYS: Record<string, string> = {
  'Validation error': 'auth.errors.validation',
  'Invalid username or password': 'auth.errors.invalid-credentials',
  'Username already taken': 'auth.errors.username-taken',
  'No passkey for this user': 'auth.errors.no-passkey',
}

export function useAuth() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function authenticate(action: () => Promise<AuthUserResponse>, cancelledMessage: string, fallback: string) {
    setIsLoading(true)
    setError(null)
    try {
      const user = await action()

      queryClient.setQueryData<AuthUserResponse>(['me'], user)
      navigate('/', { replace: true })
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError(cancelledMessage)
      } else {
        const message = e instanceof Error ? e.message : fallback
        setError(ERROR_KEYS[message] ? t(ERROR_KEYS[message]) : message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function loginWithPasskey(username: string) {
    return authenticate(async () => {
      const { options, userId } = await authApi.loginBegin(username)
      const response = await startAuthentication({ optionsJSON: options })
      return authApi.loginComplete(userId, response)
    }, 'Login was cancelled.', 'Login failed')
  }

  function registerWithPassword(username: string, displayName: string, password: string) {
    return authenticate(
      () => authApi.registerPassword(username, displayName, password),
      'Registration was cancelled.',
      'Registration failed'
    )
  }

  function loginWithPassword(username: string, password: string) {
    return authenticate(
      () => authApi.loginPassword(username, password),
      'Login was cancelled.',
      'Login failed'
    )
  }

  return { loginWithPasskey, registerWithPassword, loginWithPassword, isLoading, error }
}
