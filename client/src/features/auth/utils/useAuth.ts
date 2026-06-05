import { useState } from 'react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
// import { authApi } from '@/entities/auth'
import {type User} from '@/entities/user'
import {api, queryClient} from "@/shared/api/apiClient.ts";
import {useNavigate} from "react-router-dom";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function registerWithPasskey(username: string, displayName: string) {
    setIsLoading(true)
    setError(null)
    try {
      const { options, userId } = await api<any>('/auth/register/begin', {
        method: 'POST',
        body: { username, displayName }
      })

      const response = await startRegistration({ optionsJSON: options })

      const user = await api<Pick<User, 'displayName'>>('/auth/register/complete', {
        method: 'POST',
        body: { userId, username, displayName, response }
      })

      queryClient.setQueryData('me', user)
      navigate('/', { replace: true })
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

      const user = await api<Pick<User, 'displayName'>>('/auth/login/complete', {
        method: 'POST',
        body: { userId, response }
      })

      queryClient.setQueryData('me', user)
      navigate('/', { replace: true })
    } catch {
      setError('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return { registerWithPasskey, loginWithPasskey, isLoading, error }
}