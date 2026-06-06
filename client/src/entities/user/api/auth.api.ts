import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { api } from '@/shared/api/apiClient'
import type { User } from '@/entities/user'

interface RegisterBeginResponse {
  options: PublicKeyCredentialCreationOptionsJSON
  userId: string
}

interface LoginBeginResponse {
  options: PublicKeyCredentialRequestOptionsJSON
  userId: string
}

export type AuthUserResponse = Pick<User, 'displayName'>


export const authApi = {
  registerBegin: async (username: string, displayName: string) => api<RegisterBeginResponse>('/auth/register/begin', {
    method: 'POST',
    body: { username, displayName },
  }),

  registerComplete: (
    userId: string,
    username: string,
    displayName: string,
    response: Awaited<ReturnType<typeof startRegistration>>
  )=> api<AuthUserResponse>('/auth/register/complete', {
    method: 'POST',
    body: { userId, username, displayName, response },
  }),

  loginBegin: (username: string)=> api<LoginBeginResponse>('/auth/login/begin', {
    method: 'POST',
    body: { username },
  }),

  loginComplete: (
    userId: string,
    response: Awaited<ReturnType<typeof startAuthentication>>
  )=> api<AuthUserResponse>('/auth/login/complete', {
    method: 'POST',
    body: { userId, response },
  })
}