import { Router } from 'express'
import { prisma } from '../db/client'
import { AppError } from '../middleware/errorHandler'
import { CreateBoardSchema, UpdateBoardSchema } from '../types/board.types'
import { createMockBoard } from '../mocks/boards.mock'
import { randomUUID } from 'crypto'

export const boardsRouter = Router()

// GET /api/boards — все активные доски, поддерживает ?search=
boardsRouter.get('/', async (req, res) => {
  const search = req.query.search as string | undefined

  const boards = await prisma.board.findMany({
    where: {
      active: true,
      ...(search && {
        title: { contains: search }
      }),
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ boards, total: boards.length })
})

// GET /api/boards/:id — одна доска
boardsRouter.get('/:id', async (req, res) => {
  const board = await prisma.board.findFirst({
    where: { id: req.params.id, active: true },
  })

  if (!board) throw new AppError(404, `Board "${req.params.id}" not found`)

  res.json(board)
})

// POST /api/boards/mock — создать случайную доску через faker
// Важно: до /:id, иначе Express примет "mock" за id
boardsRouter.post('/mock', async (_req, res) => {
  const mock = createMockBoard()

  const board = await prisma.board.create({
    data: {
      id:        mock.id,
      title:     mock.title,
      color:     mock.color,
      taskCount: mock.taskCount,
      createdAt: new Date(mock.createdAt),
    },
  })

  res.status(201).json(board)
})

// POST /api/boards — создать доску
boardsRouter.post('/', async (req, res) => {
  const data = CreateBoardSchema.parse(req.body)

  const board = await prisma.board.create({
    data: {
      id:    randomUUID(),
      ...data,
    },
  })

  res.status(201).json(board)
})

// PATCH /api/boards/:id — частичное обновление
boardsRouter.patch('/:id', async (req, res) => {
  const data = UpdateBoardSchema.parse(req.body)

  const existing = await prisma.board.findFirst({
    where: { id: req.params.id, active: true },
  })
  if (!existing) throw new AppError(404, `Board "${req.params.id}" not found`)

  const board = await prisma.board.update({
    where: { id: req.params.id },
    data,
  })

  res.json(board)
})

// DELETE /api/boards/:id — мягкое удаление (active = false)
boardsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.board.findFirst({
    where: { id: req.params.id, active: true },
  })
  if (!existing) throw new AppError(404, `Board "${req.params.id}" not found`)

  await prisma.board.update({
    where: { id: req.params.id },
    data:  { active: false },
  })

  res.status(204).send()
})