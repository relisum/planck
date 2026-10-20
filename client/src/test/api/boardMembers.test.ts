import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClientProvider } from 'react-query'
import { createElement } from 'react'
import * as React from 'react'
import { queryClient } from '@/shared/api/apiClient'
import { boardApi, type Board, type BoardMember } from '@/entities/board'
import { mockFetch, requestBody } from '../utils/fetchMock'

const owner: BoardMember = { id: 'u-owner', username: 'owner', displayName: 'Owner', role: 'owner', joinedAt: new Date() }
const member: BoardMember = { id: 'u-member', username: 'member', displayName: 'Member', role: 'member', joinedAt: new Date() }

function makeBoard(members: BoardMember[]): Board {
  return {
    id: 'b1',
    title: 'Board',
    color: '#378ADD',
    order: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    role: 'owner',
    _count: { tasks: 0, members: members.length },
    columns: [],
    members,
  }
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children)

const boardsCount = () => queryClient.getQueryData<Board[]>(['boards'])?.[0]._count.members

beforeEach(() => {
  queryClient.clear()
  queryClient.setQueryData(['board', 'b1'], makeBoard([owner, member]))
  queryClient.setQueryData(['boards'], [makeBoard([owner, member])])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('boardApi.useAddMember', () => {
  it('отправляет логин и добавляет участника в кэш доски и счётчик', async () => {
    const newcomer = { ...member, id: 'u-new', username: 'newcomer' }
    const fetchMock = mockFetch(() => ({ status: 201, body: newcomer }))
    const { result } = renderHook(() => boardApi.useAddMember(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ boardId: 'b1', username: 'newcomer' })
    })

    expect(fetchMock.mock.calls[0][0]).toContain('/boards/b1/members')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(requestBody(fetchMock)).toEqual({ username: 'newcomer' })

    const board = queryClient.getQueryData<Board>(['board', 'b1'])
    expect(board?.members?.map(m => m.id)).toEqual(['u-owner', 'u-member', 'u-new'])
    expect(boardsCount()).toBe(3)
  })

  it('при ошибке пробрасывает сообщение сервера и не меняет кэш', async () => {
    mockFetch(() => ({ status: 404, body: { error: 'User not found' } }))
    const { result } = renderHook(() => boardApi.useAddMember(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({ boardId: 'b1', username: 'ghost' })).rejects.toThrow('User not found')
    })

    expect(queryClient.getQueryData<Board>(['board', 'b1'])?.members).toHaveLength(2)
    expect(boardsCount()).toBe(2)
  })
})

describe('boardApi.useRemoveMember', () => {
  it('оптимистично убирает исключённого участника', async () => {
    let resolve!: () => void
    const pending = new Promise<void>(r => { resolve = r })
    const fetchMock = vi.fn(async () => { await pending; return { ok: true, status: 204, json: async () => undefined } })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => boardApi.useRemoveMember(), { wrapper })
    act(() => { result.current.mutate({ boardId: 'b1', userId: 'u-member' }) })

    await waitFor(() => {
      expect(queryClient.getQueryData<Board>(['board', 'b1'])?.members?.map(m => m.id)).toEqual(['u-owner'])
    })
    expect(boardsCount()).toBe(1)
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining('/boards/b1/members/u-member'), expect.objectContaining({ method: 'DELETE' })])

    resolve()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('выход из доски убирает её из списка и сбрасывает кэш доски', async () => {
    mockFetch(() => ({ status: 204 }))
    const { result } = renderHook(() => boardApi.useRemoveMember(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ boardId: 'b1', userId: 'u-member', isSelf: true })
    })

    expect(queryClient.getQueryData<Board[]>(['boards'])).toEqual([])
    expect(queryClient.getQueryData(['board', 'b1'])).toBeUndefined()
  })

  it('откатывает кэш при ошибке сервера', async () => {
    mockFetch(() => ({ status: 403, body: { error: 'Only the board owner can do this' } }))
    const { result } = renderHook(() => boardApi.useRemoveMember(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({ boardId: 'b1', userId: 'u-member' })).rejects.toThrow()
    })

    expect(queryClient.getQueryData<Board>(['board', 'b1'])?.members).toHaveLength(2)
    expect(boardsCount()).toBe(2)
  })
})
