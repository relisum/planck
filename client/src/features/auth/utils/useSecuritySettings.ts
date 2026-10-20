import {useState} from "react"
import * as React from "react"
import {startRegistration} from "@simplewebauthn/browser"
import {authApi, type User} from "@/entities/user"
import {queryClient} from "@/shared/api/apiClient"


export const PASSWORD_MIN = 8

const ERROR_KEYS: Record<string, string> = {
  'Current password is incorrect': 'security.errors.current',
  'Validation error': 'security.errors.validation',
}

type Notice = { kind: 'success' | 'error', key: string }

/**
 * Настройки входа: смена пароля и привязка passkey к текущему аккаунту
 */
export function useSecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingPasskey, setIsAddingPasskey] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < PASSWORD_MIN || isSaving) return

    setIsSaving(true)
    setNotice(null)
    try {
      const user = await authApi.setPassword(password, currentPassword || undefined)
      queryClient.setQueryData<User>(['me'], user)
      setCurrentPassword('')
      setPassword('')
      setNotice({ kind: 'success', key: 'security.password-saved' })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setNotice({ kind: 'error', key: ERROR_KEYS[message] ?? 'security.errors.password' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddPasskey() {
    if (isAddingPasskey) return

    setIsAddingPasskey(true)
    setNotice(null)
    try {
      const { options } = await authApi.passkeyBegin()
      const response = await startRegistration({ optionsJSON: options })
      const user = await authApi.passkeyComplete(response)
      queryClient.setQueryData<User>(['me'], user)
      setNotice({ kind: 'success', key: 'security.passkey-added' })
    } catch (err) {
      const cancelled = err instanceof Error && err.name === 'NotAllowedError'
      const duplicate = err instanceof Error && err.name === 'InvalidStateError'
      setNotice({
        kind: 'error',
        key: cancelled ? 'security.errors.passkey-cancelled'
          : duplicate ? 'security.errors.passkey-exists'
          : 'security.errors.passkey'
      })
    } finally {
      setIsAddingPasskey(false)
    }
  }

  return {
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    isSaving,
    isAddingPasskey,
    notice,
    isPasswordValid: password.length >= PASSWORD_MIN,
    handlePasswordSubmit,
    handleAddPasskey,
  }
}
