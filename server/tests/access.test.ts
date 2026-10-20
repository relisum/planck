import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createBoard, registerUser, startServer, stopServer } from './helpers'
import { prisma } from '../src/db/client'

beforeAll(startServer)
afterAll(stopServer)

/**
 * Посторонний пользователь не должен ни читать, ни менять содержимое чужой доски по id
 */
describe('доступ к чужой доске', () => {
  async function setup() {
    const owner = await registerUser('owner')
    const stranger = await registerUser('stranger')
    const board = await createBoard(owner.client)
    const column = (await owner.client.post(`/board/${board.id}/columns/create`)).body
    const task = (await owner.client.post(`/column/${column.id}/tasks/create`, { content: 'secret' })).body
    const subtask = (await owner.client.post(`/tasks/${task.id}/subtasks/create`, { content: 'sub' })).body
    return { owner, stranger, board, column, task, subtask }
  }

  it('все операции возвращают 404 и ничего не меняют', async () => {
    const { owner, stranger: { client }, board, column, task, subtask } = await setup()

    const attempts = [
      client.get(`/board/${board.id}`),
      client.get(`/boards/${board.id}/members`),
      client.patch(`/boards/${board.id}/rename`, { title: 'hacked' }),
      client.delete(`/boards/${board.id}/delete`),
      client.post(`/board/${board.id}/columns/create`),
      client.patch(`/board/${board.id}/columns/${column.id}/move`, { fromIndex: 0, toIndex: 0 }),
      client.patch(`/board/${board.id}/tasks/${task.id}/move`, { toIndex: 0, targetColumnId: column.id }),
      client.patch(`/board/columns/${column.id}/rename`, { title: 'hacked' }),
      client.delete(`/board/columns/${column.id}/delete`),
      client.get(`/column/${column.id}/tasks`),
      client.post(`/column/${column.id}/tasks/create`, { content: 'spam' }),
      client.patch(`/tasks/${task.id}/edit`, { content: 'hacked' }),
      client.patch(`/tasks/${task.id}/priority`, { priority: 'high' }),
      client.patch(`/tasks/${task.id}/toggle`, { done: false }),
      client.patch(`/tasks/${task.id}/changeDate`, { date: null }),
      client.delete(`/tasks/${task.id}/delete`),
      client.post(`/tasks/${task.id}/subtasks/create`, { content: 'spam' }),
      client.patch(`/tasks/subtasks/${subtask.id}/toggle`, { done: true }),
      client.patch(`/tasks/subtasks/${subtask.id}/change`, { content: 'hacked' }),
      client.patch(`/tasks/${task.id}/subtasks/${subtask.id}/move`, { fromIndex: 0, toIndex: 0 }),
      client.delete(`/tasks/subtasks/${subtask.id}/delete`),
    ]

    const statuses = (await Promise.all(attempts)).map(r => r.status)
    expect(statuses).toEqual(attempts.map(() => 404))

    const board_ = (await owner.client.get(`/board/${board.id}`)).body
    expect(board_.title).toBe('Board')
    expect(board_.columns).toHaveLength(1)
    expect(board_.columns[0].title).not.toBe('hacked')
    expect(board_.columns[0].tasks).toHaveLength(1)
    expect(board_.columns[0].tasks[0]).toMatchObject({ content: 'secret', priority: null })
    expect(board_.columns[0].tasks[0].subtasks).toEqual([expect.objectContaining({ content: 'sub', done: false })])
  })

  it('нельзя переместить свою задачу в колонку чужой доски', async () => {
    const { stranger, column } = await setup()
    const ownBoard = await createBoard(stranger.client)
    const ownColumn = (await stranger.client.post(`/board/${ownBoard.id}/columns/create`)).body
    const ownTask = (await stranger.client.post(`/column/${ownColumn.id}/tasks/create`, { content: 'mine' })).body

    const res = await stranger.client.patch(`/board/${ownBoard.id}/tasks/${ownTask.id}/move`, { toIndex: 0, targetColumnId: column.id })
    expect(res.status).toBe(404)
  })

  it('перемещение подзадачи с перебалансировкой отвечает, а не зависает', async () => {
    const { owner, task, subtask } = await setup()
    const second = (await owner.client.post(`/tasks/${task.id}/subtasks/create`, { content: 'second' })).body
    const third = (await owner.client.post(`/tasks/${task.id}/subtasks/create`, { content: 'third' })).body

    // Зазор < 1 между соседями заставляет сервер перенумеровать подзадачи
    await prisma.subtasks.update({ where: { id: second.id }, data: { order: 1000.25 } })
    await prisma.subtasks.update({ where: { id: third.id }, data: { order: 1000.5 } })

    const res = await owner.client.patch(`/tasks/${task.id}/subtasks/${third.id}/move`, { fromIndex: 2, toIndex: 1 })
    expect(res.status).toBe(204)

    const orders = await prisma.subtasks.findMany({ where: { taskId: task.id }, orderBy: { order: 'asc' } })
    expect(orders.map(s => s.id)).toEqual([subtask.id, third.id, second.id])
  })
})
