import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from 'react-query'
import i18n from '@/i18n'
import { queryClient } from '@/shared/api/apiClient'
import { BoardMembers } from '@/features/board-members'
import type { Board, BoardMember, BoardRole } from '@/entities/board'
import type { User } from '@/entities/user'
import { mockFetch, requestBody } from '../utils/fetchMock'

const owner: BoardMember = { id: 'u-owner', username: 'owner', displayName: 'Olga', role: 'owner', joinedAt: new Date() }
const member: BoardMember = { id: 'u-member', username: 'member', displayName: 'Mark', role: 'member', joinedAt: new Date() }

function setMe(member: BoardMember) {
  const me: User = { id: member.id, username: member.username, displayName: member.displayName, hasPassword: true, passkeys: 0 }
  queryClient.setQueryData('me', me)
}

function renderMembers(role: BoardRole, members = [owner, member]) {
  queryClient.setQueryData<Partial<Board>>(['board', 'b1'], { id: 'b1', members })
  queryClient.setQueryData<Partial<Board>[]>(['boards'], [{ id: 'b1', _count: { tasks: 0, members: members.length } }])

  return render(
    <QueryClientProvider client={queryClient}>
      <BoardMembers boardId="b1" members={members} role={role} />
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

describe('BoardMembers — владелец', () => {
  beforeEach(() => setMe(owner))

  it('показывает кнопку «Поделиться» и открывает список участников', async () => {
    renderMembers('owner')

    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    const dialog = screen.getByRole('dialog', { name: 'Members' })

    expect(within(dialog).getByText('Olga')).toBeInTheDocument()
    expect(within(dialog).getByText('@member')).toBeInTheDocument()
    expect(within(dialog).getByText('Owner')).toBeInTheDocument()
    expect(within(dialog).getByText('(you)')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('button', { name: 'Remove from board' })).toHaveLength(1)
  })

  it('приглашает по логину, убирая ведущий @', async () => {
    const fetchMock = mockFetch(() => ({ status: 201, body: { ...member, id: 'u-new', username: 'newbie' } }))
    renderMembers('owner')

    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    await userEvent.type(screen.getByPlaceholderText('Username'), '@newbie')
    await userEvent.click(screen.getByRole('button', { name: 'Invite' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(requestBody(fetchMock)).toEqual({ username: 'newbie' })
    await waitFor(() => expect(screen.getByPlaceholderText('Username')).toHaveValue(''))
  })

  it('показывает понятную ошибку, если пользователь уже участник', async () => {
    mockFetch(() => ({ status: 409, body: { error: 'User is already a member' } }))
    renderMembers('owner')

    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    await userEvent.type(screen.getByPlaceholderText('Username'), 'member')
    await userEvent.click(screen.getByRole('button', { name: 'Invite' }))

    expect(await screen.findByText('Already a member')).toBeInTheDocument()
  })

  it('кнопка приглашения неактивна при пустом логине', async () => {
    renderMembers('owner')
    await userEvent.click(screen.getByRole('button', { name: /share/i }))

    expect(screen.getByRole('button', { name: 'Invite' })).toBeDisabled()
  })

  it('исключает участника', async () => {
    const fetchMock = mockFetch(() => ({ status: 204 }))
    renderMembers('owner')

    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove from board' }))

    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining('/boards/b1/members/u-member'), expect.objectContaining({ method: 'DELETE' })])
    expect(queryClient.getQueryData<Board>(['board', 'b1'])?.members?.map(m => m.id)).toEqual(['u-owner'])
  })

  it('закрывается по Escape', async () => {
    renderMembers('owner')
    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('BoardMembers — участник', () => {
  beforeEach(() => setMe(member))

  it('не может приглашать и исключать, но может покинуть доску', async () => {
    const fetchMock = mockFetch(() => ({ status: 204 }))
    renderMembers('member')

    await userEvent.click(screen.getByRole('button', { name: 'Members' }))

    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove from board' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))

    expect(fetchMock.mock.calls[0][0]).toContain('/boards/b1/members/u-member')
    expect(queryClient.getQueryData<Partial<Board>[]>(['boards'])).toEqual([])
  })
})
