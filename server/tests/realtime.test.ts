import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Client, createBoard, EventStream, registerUser, settle, startServer, stopServer } from './helpers'
import { connectionCount } from '../src/realtime/events'

beforeAll(startServer)
afterAll(stopServer)

const streams: EventStream[] = []

async function subscribe(client: Client, clientId?: string) {
  const stream = await client.subscribe(clientId)
  streams.push(stream)
  return stream
}

afterEach(async () => {
  await Promise.all(streams.splice(0).map(s => s.close()))
})

async function setupSharedBoard() {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const board = await createBoard(owner.client, 'Shared')
  await owner.client.post(`/boards/${board.id}/members`, { username: member.user.username })
  const column = (await owner.client.post(`/board/${board.id}/columns/create`)).body
  return { owner, member, board, column }
}

const forBoard = (boardId: string, event = 'board') =>
  (e: { event: string; data: any }) => e.event === event && e.data?.boardId === boardId

describe('Server-Sent Events', () => {
  it('без авторизации поток недоступен', async () => {
    const stream = await subscribe(new Client())
    expect(stream.status).toBe(401)
  })

  it('участник получает событие, когда другой участник меняет доску', async () => {
    const { owner, member, board, column } = await setupSharedBoard()
    const memberStream = await subscribe(member.client)

    await owner.client.post(`/column/${column.id}/tasks/create`, { content: 'new task' })

    await memberStream.waitFor(forBoard(board.id))
  })

  it.each([
    ['перемещение задачи', async (c: Client, ctx: any) => c.patch(`/board/${ctx.board.id}/tasks/${ctx.task.id}/move`, { toIndex: 0, targetColumnId: ctx.column.id })],
    ['редактирование задачи', async (c: Client, ctx: any) => c.patch(`/tasks/${ctx.task.id}/edit`, { content: 'edited' })],
    ['выполнение задачи', async (c: Client, ctx: any) => c.patch(`/tasks/${ctx.task.id}/toggle`, { done: false })],
    ['удаление задачи', async (c: Client, ctx: any) => c.delete(`/tasks/${ctx.task.id}/delete`)],
    ['новая подзадача', async (c: Client, ctx: any) => c.post(`/tasks/${ctx.task.id}/subtasks/create`, { content: 'sub' })],
    ['переименование колонки', async (c: Client, ctx: any) => c.patch(`/board/columns/${ctx.column.id}/rename`, { title: 'Renamed' })],
    ['удаление колонки', async (c: Client, ctx: any) => c.delete(`/board/columns/${ctx.column.id}/delete`)],
    ['новая колонка', async (c: Client, ctx: any) => c.post(`/board/${ctx.board.id}/columns/create`)],
    ['переименование доски', async (c: Client, ctx: any) => c.patch(`/boards/${ctx.board.id}/rename`, { title: 'New title' })],
  ])('событие приходит на: %s', async (_, action) => {
    const ctx = await setupSharedBoard()
    ctx.task = (await ctx.owner.client.post(`/column/${ctx.column.id}/tasks/create`, { content: 'task' })).body
    const memberStream = await subscribe(ctx.member.client)

    const res = await action(ctx.owner.client, ctx)
    expect(res.status).toBeLessThan(300)

    await memberStream.waitFor(forBoard(ctx.board.id))
  })

  it('автор изменения не получает своё событие, а его другая вкладка получает', async () => {
    const { owner, board, column } = await setupSharedBoard()
    const sameTab = await subscribe(owner.client)
    const otherTab = await subscribe(owner.client, 'other-tab')

    await owner.client.post(`/column/${column.id}/tasks/create`, { content: 'mine' })

    await otherTab.waitFor(forBoard(board.id))
    await settle()
    expect(sameTab.events).toEqual([])
  })

  it('посторонний не получает событий чужой доски', async () => {
    const { owner, column } = await setupSharedBoard()
    const stranger = await registerUser('stranger')
    const strangerStream = await subscribe(stranger.client)

    await owner.client.post(`/column/${column.id}/tasks/create`, { content: 'secret' })

    await settle()
    expect(strangerStream.events).toEqual([])
  })

  it('приглашённый сразу получает событие и видит доску', async () => {
    const owner = await registerUser('owner')
    const invited = await registerUser('invited')
    const board = await createBoard(owner.client)
    const invitedStream = await subscribe(invited.client)

    await owner.client.post(`/boards/${board.id}/members`, { username: invited.user.username })

    await invitedStream.waitFor(forBoard(board.id))
  })

  it('исключённый получает событие списка досок, остальные — события доски', async () => {
    const { owner, member, board } = await setupSharedBoard()
    const third = await registerUser('third')
    await owner.client.post(`/boards/${board.id}/members`, { username: third.user.username })
    const memberStream = await subscribe(member.client)
    const thirdStream = await subscribe(third.client)

    await owner.client.delete(`/boards/${board.id}/members/${member.user.id}`)

    await memberStream.waitFor(forBoard(board.id, 'boards'))
    await thirdStream.waitFor(forBoard(board.id))
  })

  it('после выхода участник больше не получает события доски', async () => {
    const { owner, member, board, column } = await setupSharedBoard()
    await member.client.delete(`/boards/${board.id}/members/${member.user.id}`)
    const memberStream = await subscribe(member.client)

    await owner.client.post(`/column/${column.id}/tasks/create`, { content: 'after leave' })

    await settle()
    expect(memberStream.events).toEqual([])
  })

  it('удаление и восстановление доски обновляют список досок участников', async () => {
    const { owner, member, board } = await setupSharedBoard()
    const memberStream = await subscribe(member.client)

    await owner.client.delete(`/boards/${board.id}/delete`)
    await memberStream.waitFor(forBoard(board.id, 'boards'))

    memberStream.events = []
    await owner.client.patch(`/boards/${board.id}/restore`)
    await memberStream.waitFor(forBoard(board.id, 'boards'))
  })

  it('закрытое соединение удаляется', async () => {
    const { client, user } = await registerUser()
    const stream = await client.subscribe()

    await expect.poll(() => connectionCount(user.id)).toBe(1)
    await stream.close()
    await expect.poll(() => connectionCount(user.id)).toBe(0)
  })
})
