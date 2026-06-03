import { useState } from 'react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
// import { authApi } from '@/entities/auth'
import {type User} from '@/entities/user'
import {api} from "@/shared/api/apiClient.ts";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function registerWithPasskey(username: string, displayName: string) {
    setIsLoading(true)
    setError(null)
    try {
      const { options, userId } = await api<any>('/auth/register/begin', {
        method: 'POST',
        body: { username, displayName }
      })

      const response = await startRegistration({ optionsJSON: options })

      await api<User>('/auth/register/complete', {
        method: 'POST',
        body: { userId, username, displayName, response }
      })

      window.location.href = '/'
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        setError('Registration was cancelled.')
      } else {
        setError(e.message ?? 'Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function loginWithPasskey(username: string) {
    setIsLoading(true)
    setError(null)
    try {
      const { options, userId } = await api<any>('/auth/login/begin', {
        method: 'POST',
        body: { username }
      })

      const response = await startAuthentication({ optionsJSON: options })

      await api<User>('/auth/login/complete', {
        method: 'POST',
        body: { userId, response }
      })

      window.location.href = '/'
    } catch (e: any) {
      setError(e.message ?? 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return { registerWithPasskey, loginWithPasskey, isLoading, error }
}