import { Router } from 'express'
import { db } from '../db/client'
import { AppError } from '../middleware/errorHandler'
import { CreateBoardSchema, UpdateBoardSchema, type Board } from '../types/board.types'
import { createMockBoard } from '../mocks/boards.mock'
import { randomUUID } from 'crypto'

export const boardsRouter = Router()

function rowToBoard(row: Record<string, unknown>): Board {
  return {
    id:        row.id         as string,
    title:     row.title      as string,
    color:     row.color      as string,
    taskCount: row.task_count as number,
    createdAt: row.created_at as string,
  }
}

// GET /api/boards — все доски, поддерживает ?search=
boardsRouter.get('/', (req, res) => {
  const search = req.query.search as string | undefined

  const rows = search
    ? db.prepare('SELECT * FROM boards WHERE title LIKE ? ORDER BY created_at DESC')
      .all(`%${search}%`) as Record<string, unknown>[]
    : db.prepare('SELECT * FROM boards ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

  const boards = rows.map(rowToBoard)
  res.json({ boards, total: boards.length })
})

// GET /api/boards/:id — одна доска
boardsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM boards WHERE id = ?')
    .get(req.params.id) as Record<string, unknown> | undefined

  if (!row) throw new AppError(404, `Board "${req.params.id}" not found`)

  res.json(rowToBoard(row))
})

// POST /api/boards/mock — создать случайную доску через faker
// Важно: до /:id, иначе Express примет "mock" за id
boardsRouter.post('/mock', (_req, res) => {
  const board = createMockBoard()

  db.prepare(`
    INSERT INTO boards (id, title, color, task_count, created_at)
    VALUES (@id, @title, @color, @taskCount, @createdAt)
  `).run(board)

  res.status(201).json(board)
})

// POST /api/boards — создать доску
boardsRouter.post('/', (req, res) => {
  const data = CreateBoardSchema.parse(req.body)

  const board: Board = {
    id:        randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  }

  db.prepare(`
    INSERT INTO boards (id, title, color, task_count, created_at)
    VALUES (@id, @title, @color, @taskCount, @createdAt)
  `).run(board)

  res.status(201).json(board)
})

// PATCH /api/boards/:id — частичное обновление
boardsRouter.patch('/:id', (req, res) => {
  const data = UpdateBoardSchema.parse(req.body)

  const existing = db.prepare('SELECT id FROM boards WHERE id = ?').get(req.params.id)
  if (!existing) throw new AppError(404, `Board "${req.params.id}" not found`)

  const fieldMap: Record<string, string> = {
    title:     'title',
    color:     'color',
    taskCount: 'task_count',
  }

  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (entries.length === 0) throw new AppError(400, 'No fields to update')

  const setClauses = entries.map(([key]) => `${fieldMap[key]} = ?`).join(', ')
  const values     = entries.map(([, v]) => v)

  db.prepare(`UPDATE boards SET ${setClauses} WHERE id = ?`)
    .run(...values, req.params.id)

  const updated = db.prepare('SELECT * FROM boards WHERE id = ?')
    .get(req.params.id) as Record<string, unknown>

  res.json(rowToBoard(updated))
})

// DELETE /api/boards/:id — удалить доску
boardsRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM boards WHERE id = ?').get(req.params.id)
  if (!existing) throw new AppError(404, `Board "${req.params.id}" not found`)

  db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id)

  res.status(204).send()
})