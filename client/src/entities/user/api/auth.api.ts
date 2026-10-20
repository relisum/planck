import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { api } from '@/shared/api/apiClient'
import type { User } from '@/entities/user'

interface PasskeyBeginResponse {
  options: PublicKeyCredentialCreationOptionsJSON
}

interface LoginBeginResponse {
  options: PublicKeyCredentialRequestOptionsJSON
  userId: string
}

export type AuthUserResponse = User


export const authApi = {
  registerPassword: (username: string, displayName: string, password: string) => api<AuthUserResponse>('/auth/register/password', {
    method: 'POST',
    body: { username, displayName, password },
  }),

  loginPassword: (username: string, password: string) => api<AuthUserResponse>('/auth/login/password', {
    method: 'POST',
    body: { username, password },
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
  }),

  setPassword: (password: string, currentPassword?: string) => api<AuthUserResponse>('/auth/password', {
    method: 'POST',
    body: { password, currentPassword },
  }),

  passkeyBegin: () => api<PasskeyBeginResponse>('/auth/passkey/begin', {
    method: 'POST',
  }),

  passkeyComplete: (response: Awaited<ReturnType<typeof startRegistration>>) => api<AuthUserResponse>('/auth/passkey/complete', {
    method: 'POST',
    body: { response },
  }),
}
