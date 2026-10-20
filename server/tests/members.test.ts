import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client, createBoard, registerUser, startServer, stopServer, uniqueName } from './helpers'

beforeAll(startServer)
afterAll(stopServer)

async function setupSharedBoard() {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const board = await createBoard(owner.client, 'Shared')

  const invite = await owner.client.post(`/boards/${board.id}/members`, { username: member.user.username })
  expect(invite.status).toBe(201)

  return { owner, member, board }
}

describe('создание доски', () => {
  it('создатель становится владельцем и единственным участником', async () => {
    const { client, user } = await registerUser()
    const board = await createBoard(client)

    expect(board.role).toBe('owner')

    const res = await client.get(`/board/${board.id}`)
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('owner')
    expect(res.body.members).toEqual([
      expect.objectContaining({ id: user.id, username: user.username, role: 'owner' }),
    ])
  })

  it('список содержит только доски пользователя', async () => {
    const alice = await registerUser()
    const bob = await registerUser()
    const board = await createBoard(alice.client, 'Private')

    const bobBoards = (await bob.client.get('/boards')).body as { id: string }[]
    expect(bobBoards.map(b => b.id)).not.toContain(board.id)
  })
})

describe('приглашение участников', () => {
  it('участник видит доску в списке с ролью member', async () => {
    const { member, board } = await setupSharedBoard()

    const boards = (await member.client.get('/boards')).body as any[]
    const shared = boards.find(b => b.id === board.id)

    expect(shared).toMatchObject({ title: 'Shared', role: 'member', _count: { members: 2 } })
  })

  it('возвращает данные приглашённого', async () => {
    const owner = await registerUser()
    const member = await registerUser()
    const board = await createBoard(owner.client)

    const res = await owner.client.post(`/boards/${board.id}/members`, { username: member.user.username })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ id: member.user.id, username: member.user.username, role: 'member' })
  })

  it('не добавляет участника повторно', async () => {
    const { owner, member, board } = await setupSharedBoard()
    const res = await owner.client.post(`/boards/${board.id}/members`, { username: member.user.username })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('User is already a member')
  })

  it('сообщает о несуществующем пользователе', async () => {
    const owner = await registerUser()
    const board = await createBoard(owner.client)
    const res = await owner.client.post(`/boards/${board.id}/members`, { username: uniqueName('ghost') })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('User not found')
  })

  it('приглашать может только владелец', async () => {
    const { member, board } = await setupSharedBoard()
    const stranger = await registerUser()

    const res = await member.client.post(`/boards/${board.id}/members`, { username: stranger.user.username })
    expect(res.status).toBe(403)
  })

  it('посторонний не может пригласить себя в чужую доску', async () => {
    const owner = await registerUser()
    const stranger = await registerUser()
    const board = await createBoard(owner.client)

    const res = await stranger.client.post(`/boards/${board.id}/members`, { username: stranger.user.username })
    expect(res.status).toBe(404)
  })
})

describe('совместная работа', () => {
  it('изменения участника видны владельцу', async () => {
    const { owner, member, board } = await setupSharedBoard()

    const column = (await member.client.post(`/board/${board.id}/columns/create`)).body
    const task = await member.client.post(`/column/${column.id}/tasks/create`, { content: 'from member' })
    expect(task.status).toBe(201)

    const rename = await member.client.patch(`/boards/${board.id}/rename`, { title: 'Renamed by member' })
    expect(rename.status).toBe(204)

    const ownerView = (await owner.client.get(`/board/${board.id}`)).body
    expect(ownerView.title).toBe('Renamed by member')
    expect(ownerView.columns[0].tasks.map((t: any) => t.content)).toEqual(['from member'])
  })

  it('удалять и восстанавливать доску может только владелец', async () => {
    const { owner, member, board } = await setupSharedBoard()

    expect((await member.client.delete(`/boards/${board.id}/delete`)).status).toBe(403)
    expect((await owner.client.delete(`/boards/${board.id}/delete`)).status).toBe(204)

    const memberBoards = (await member.client.get('/boards')).body as any[]
    expect(memberBoards.map(b => b.id)).not.toContain(board.id)

    expect((await member.client.patch(`/boards/${board.id}/restore`)).status).toBe(403)
    expect((await owner.client.patch(`/boards/${board.id}/restore`)).status).toBe(204)

    const restored = (await member.client.get('/boards')).body as any[]
    expect(restored.map(b => b.id)).toContain(board.id)
  })

  it('порядок досок в сайдбаре у каждого участника свой', async () => {
    const owner = await registerUser()
    const member = await registerUser()
    const shared = await createBoard(owner.client, 'Shared')
    const own = await createBoard(member.client, 'Own')
    await owner.client.post(`/boards/${shared.id}/members`, { username: member.user.username })

    let memberBoards = (await member.client.get('/boards')).body as any[]
    expect(memberBoards.map(b => b.title)).toEqual(['Own', 'Shared'])

    const move = await member.client.patch(`/boards/${shared.id}/move`, { fromIndex: 1, toIndex: 0 })
    expect(move.status).toBe(204)

    memberBoards = (await member.client.get('/boards')).body as any[]
    expect(memberBoards.map(b => b.title)).toEqual(['Shared', 'Own'])

    const ownerBoards = (await owner.client.get('/boards')).body as any[]
    expect(ownerBoards.map(b => b.id)).toEqual([shared.id])
    expect(own.id).toBeDefined()
  })
})

describe('исключение и выход', () => {
  it('владелец исключает участника, и тот теряет доступ', async () => {
    const { owner, member, board } = await setupSharedBoard()
    const column = (await owner.client.post(`/board/${board.id}/columns/create`)).body

    const res = await owner.client.delete(`/boards/${board.id}/members/${member.user.id}`)
    expect(res.status).toBe(204)

    expect((await member.client.get(`/board/${board.id}`)).status).toBe(404)
    expect((await member.client.patch(`/board/columns/${column.id}/rename`, { title: 'x' })).status).toBe(404)
    expect(((await member.client.get('/boards')).body as any[]).map(b => b.id)).not.toContain(board.id)

    const members = (await owner.client.get(`/boards/${board.id}/members`)).body as any[]
    expect(members.map(m => m.id)).toEqual([owner.user.id])
  })

  it('участник может покинуть доску сам', async () => {
    const { member, board } = await setupSharedBoard()

    expect((await member.client.delete(`/boards/${board.id}/members/${member.user.id}`)).status).toBe(204)
    expect((await member.client.get(`/board/${board.id}`)).status).toBe(404)
  })

  it('участник не может исключать других', async () => {
    const { owner, member, board } = await setupSharedBoard()
    const third = await registerUser()
    await owner.client.post(`/boards/${board.id}/members`, { username: third.user.username })

    expect((await member.client.delete(`/boards/${board.id}/members/${third.user.id}`)).status).toBe(403)
    expect((await member.client.delete(`/boards/${board.id}/members/${owner.user.id}`)).status).toBe(403)
  })

  it('владелец не может покинуть свою доску', async () => {
    const { owner, board } = await setupSharedBoard()
    const res = await owner.client.delete(`/boards/${board.id}/members/${owner.user.id}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Owner cannot leave the board')
  })

  it('исключённого можно пригласить снова', async () => {
    const { owner, member, board } = await setupSharedBoard()
    await owner.client.delete(`/boards/${board.id}/members/${member.user.id}`)

    const res = await owner.client.post(`/boards/${board.id}/members`, { username: member.user.username })
    expect(res.status).toBe(201)
    expect((await member.client.get(`/board/${board.id}`)).status).toBe(200)
  })
})

describe('без авторизации', () => {
  it('API досок недоступно', async () => {
    expect((await new Client().get('/boards')).status).toBe(401)
  })
})
