import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from 'react-query'
import i18n from '@/i18n'
import { queryClient } from '@/shared/api/apiClient'
import { LoginForm, RegisterForm } from '@/features/auth'
import type { User } from '@/entities/user'
import { mockFetch, requestBody } from '../utils/fetchMock'

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))

const user: User = { id: 'u1', username: 'alice', displayName: 'Alice', hasPassword: true, passkeys: 0 }

function renderAt(form: React.ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={form} />
          <Route path="/" element={<p>dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  queryClient.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginForm', () => {
  it('входит по паролю и переходит на дашборд', async () => {
    const fetchMock = mockFetch(() => ({ body: user }))
    renderAt(<LoginForm />)

    await userEvent.type(screen.getByLabelText('Username', { selector: 'input' }), 'alice')
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/login/password')
    expect(requestBody(fetchMock)).toEqual({ username: 'alice', password: 'secret-password' })
    expect(queryClient.getQueryData('me')).toEqual(user)
  })

  it('показывает ошибку неверного пароля', async () => {
    mockFetch(() => ({ status: 400, body: { error: 'Invalid username or password' } }))
    renderAt(<LoginForm />)

    await userEvent.type(screen.getByLabelText('Username', { selector: 'input' }), 'alice')
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })

  it('оставляет вход по ключу и подсказывает, если ключа нет', async () => {
    mockFetch(() => ({ status: 400, body: { error: 'No passkey for this user' } }))
    renderAt(<LoginForm />)

    const passkeyButton = screen.getByRole('button', { name: /sign in with passkey/i })
    expect(passkeyButton).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Username', { selector: 'input' }), 'alice')
    await userEvent.click(passkeyButton)

    expect(await screen.findByText(/has no passkey yet/i)).toBeInTheDocument()
  })
})

describe('RegisterForm', () => {
  it('регистрирует только по паролю — кнопки создания ключа нет', () => {
    renderAt(<RegisterForm />)

    expect(screen.queryByRole('button', { name: /passkey/i })).not.toBeInTheDocument()
  })

  it('не даёт отправить пароль короче 8 символов', async () => {
    renderAt(<RegisterForm />)

    await userEvent.type(screen.getByLabelText('Username', { selector: 'input' }), 'alice')
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), '1234567')

    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
  })

  it('создаёт аккаунт и переходит на дашборд', async () => {
    const fetchMock = mockFetch(() => ({ body: user }))
    renderAt(<RegisterForm />)

    await userEvent.type(screen.getByLabelText('Username', { selector: 'input' }), 'alice')
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/register/password')
    expect(requestBody(fetchMock)).toEqual({ username: 'alice', displayName: 'Alice', password: 'secret-password' })
  })
})
