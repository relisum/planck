import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from 'react-query'
import { startRegistration } from '@simplewebauthn/browser'
import i18n from '@/i18n'
import { queryClient } from '@/shared/api/apiClient'
import { SecuritySettings } from '@/features/auth'
import type { User } from '@/entities/user'
import { mockFetch, requestBody } from '../utils/fetchMock'

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))

const passkeyOnly: User = { id: 'u1', username: 'legacy', displayName: 'Legacy', hasPassword: false, passkeys: 1 }
const withPassword: User = { ...passkeyOnly, hasPassword: true }

function renderSettings(me: User) {
  queryClient.setQueryData('me', me)
  return render(
    <QueryClientProvider client={queryClient}>
      <SecuritySettings />
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  queryClient.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(startRegistration).mockReset()
})

describe('SecuritySettings', () => {
  it('passkey-пользователь задаёт пароль без текущего', async () => {
    const fetchMock = mockFetch(() => ({ body: withPassword }))
    renderSettings(passkeyOnly)

    await userEvent.click(screen.getByRole('button', { name: 'Sign-in methods' }))
    expect(screen.getByText('Set password')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Current password')).not.toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'new-password')
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByText('Password saved')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/password')
    expect(requestBody(fetchMock)).toEqual({ password: 'new-password' })
    expect(queryClient.getQueryData<User>('me')?.hasPassword).toBe(true)
  })

  it('для смены пароля требует текущий', async () => {
    renderSettings(withPassword)

    await userEvent.click(screen.getByRole('button', { name: 'Sign-in methods' }))
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'new-password')

    expect(screen.getByRole('button', { name: 'Save password' })).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('Current password'), 'old-password')
    expect(screen.getByRole('button', { name: 'Save password' })).toBeEnabled()
  })

  it('показывает ошибку неверного текущего пароля', async () => {
    mockFetch(() => ({ status: 400, body: { error: 'Current password is incorrect' } }))
    renderSettings(withPassword)

    await userEvent.click(screen.getByRole('button', { name: 'Sign-in methods' }))
    await userEvent.type(screen.getByPlaceholderText('Current password'), 'wrong-password')
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'new-password')
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
  })

  it('привязывает ключ к аккаунту', async () => {
    vi.mocked(startRegistration).mockResolvedValue({ id: 'cred' } as never)
    const fetchMock = mockFetch(url => url.endsWith('/auth/passkey/begin')
      ? { body: { options: { challenge: 'c' } } }
      : { body: { ...withPassword, passkeys: 2 } })
    renderSettings(withPassword)

    await userEvent.click(screen.getByRole('button', { name: 'Sign-in methods' }))
    await userEvent.click(screen.getByRole('button', { name: /add passkey/i }))

    expect(await screen.findByText('Passkey added')).toBeInTheDocument()
    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: { challenge: 'c' } })
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/passkey/complete')
    expect(requestBody(fetchMock, 1)).toEqual({ response: { id: 'cred' } })
    await waitFor(() => expect(queryClient.getQueryData<User>('me')?.passkeys).toBe(2))
  })

  it('сообщает об отмене создания ключа', async () => {
    vi.mocked(startRegistration).mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'NotAllowedError' }))
    mockFetch(() => ({ body: { options: { challenge: 'c' } } }))
    renderSettings(withPassword)

    await userEvent.click(screen.getByRole('button', { name: 'Sign-in methods' }))
    await userEvent.click(screen.getByRole('button', { name: /add passkey/i }))

    expect(await screen.findByText('Passkey creation was cancelled')).toBeInTheDocument()
  })
})
