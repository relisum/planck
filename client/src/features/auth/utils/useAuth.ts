import { useState } from 'react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { queryClient } from '@/shared/api/apiClient'
import { useNavigate } from 'react-router-dom'
import {
  authApi,
  type AuthUserResponse,
} from '@/entities/user'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function registerWithPasskey(username: string, displayName: string) {
    setIsLoading(true)
    setError(null)
    try {
      const { options, userId } = await authApi.registerBegin(username, displayName)
      const response = await startRegistration({ optionsJSON: options })
      const user = await authApi.registerComplete(userId, username, displayName, response)

      queryClient.setQueryData<AuthUserResponse>(['me'], user)
      navigate('/', { replace: true })
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('Registration was cancelled.')
      } else {
        setError(e instanceof Error ? e.message : 'Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function loginWithPasskey(username: string) {
    setIsLoading(true)
    setError(null)
    try {
      const { options, userId } = await authApi.loginBegin(username)
      const response = await startAuthentication({ optionsJSON: options })
      const user = await authApi.loginComplete(userId, response)

      queryClient.setQueryData<AuthUserResponse>(['me'], user)
      navigate('/', { replace: true })
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('Login was cancelled.')
      } else {
        setError(e instanceof Error ? e.message : 'Login failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { registerWithPasskey, loginWithPasskey, isLoading, error }
}