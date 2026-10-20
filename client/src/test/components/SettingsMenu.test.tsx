import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from 'react-query'
import i18n from '@/i18n'
import { queryClient } from '@/shared/api/apiClient'
import { SettingsMenu } from '@/widgets/sidebar/components/SettingsMenu/SettingsMenu'
import type { User } from '@/entities/user'

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))

const user: User = { id: 'u1', username: 'alice', displayName: 'Alice', hasPassword: true, passkeys: 1 }

function renderMenu(me: User = user) {
  queryClient.setQueryData('me', me)
  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsMenu />
    </QueryClientProvider>
  )
}

async function openSecurity() {
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  await userEvent.click(screen.getByRole('menuitem', { name: /sign-in methods/i }))
  return screen.findByRole('dialog', { name: 'Sign-in methods' })
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  queryClient.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SettingsMenu', () => {
  it('открывает меню с пунктом настроек входа', async () => {
    renderMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const menu = screen.getByRole('menu', { name: 'Settings' })

    expect(within(menu).getByRole('menuitem', { name: /sign-in methods/i })).toBeInTheDocument()
    expect(within(menu).getByText('Password and passkeys')).toBeInTheDocument()
  })

  it('пункт меню поднимает модальное окно с настройками и закрывает меню', async () => {
    renderMenu()

    const dialog = await openSecurity()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText('Change password')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /add passkey/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('фокусирует первое поле модального окна', async () => {
    renderMenu()
    await openSecurity()

    expect(screen.getByLabelText('Current password')).toHaveFocus()
  })

  it.each([
    ['Escape', async () => userEvent.keyboard('{Escape}')],
    ['кнопке закрытия', async () => userEvent.click(screen.getByRole('button', { name: 'Close' }))],
    ['клику по фону', async () => userEvent.click(screen.getByRole('dialog').parentElement!)],
  ])('модальное окно закрывается по %s', async (_, closeAction) => {
    renderMenu()
    await openSecurity()

    await closeAction()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('клик внутри окна его не закрывает', async () => {
    renderMenu()
    const dialog = await openSecurity()

    await userEvent.click(within(dialog).getByText('Change password'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('подсказывает задать пароль, если его нет', async () => {
    renderMenu({ ...user, hasPassword: false })

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByText('Set a password to sign in anywhere')).toBeInTheDocument()
    const dialog = await (async () => {
      await userEvent.click(screen.getByRole('menuitem', { name: /sign-in methods/i }))
      return screen.findByRole('dialog')
    })()
    expect(within(dialog).getByText('Set password')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Current password')).not.toBeInTheDocument()
  })
})
