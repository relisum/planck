import { Router } from 'express'
import { prisma } from '../db/client'
import { AppError } from '../middleware/errorHandler'

import {
  CreateTaskSchema,
  MoveTaskSchema,
  UpdateTaskSchema,
} from '../schemas/task.schemas'

export const tasksRouter = Router()

/**
 * GET /api/tasks/board/:boardId
 * Все таски доски
 */
tasksRouter.get('/board/:boardId', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      boardId: req.params.boardId,
      deletedAt: null,
    },

    orderBy: [
      { columnId: 'asc' },
      { order: 'asc' },
    ],
  })

  res.json(tasks)
})

/**
 * GET /api/tasks/:id
 * Одна таска
 */
tasksRouter.get('/:id', async (req, res) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
    },
  })

  if (!task) {
    throw new AppError(404, 'Task not found')
  }

  res.json(task)
})

/**
 * POST /api/tasks
 * Создать таску
 */
tasksRouter.post('/', async (req, res) => {
  const body = CreateTaskSchema.parse(req.body)

  /**
   * Последняя таска колонки
   */
  const lastTask = await prisma.task.findFirst({
    where: {
      columnId: body.columnId,
      deletedAt: null,
    },

    orderBy: {
      order: 'desc',
    },
  })

  const order = lastTask
    ? lastTask.order + 1000
    : 1000

  const task = await prisma.task.create({
    data: {
      boardId: body.boardId,

      columnId: body.columnId,

      title: body.title,

      content: body.content,

      order,
    },
  })

  res.status(201).json(task)
})

/**
 * PATCH /api/tasks/:id
 * Обновить таску
 */
tasksRouter.patch('/:id', async (req, res) => {
  const body = UpdateTaskSchema.parse(req.body)

  const exists = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
    },
  })

  if (!exists) {
    throw new AppError(404, 'Task not found')
  }

  const task = await prisma.task.update({
    where: {
      id: req.params.id,
    },

    data: body,
  })

  res.json(task)
})

/**
 * PATCH /api/tasks/:id/move
 * Перемещение таски
 */
tasksRouter.patch('/:id/move', async (req, res) => {
  const body = MoveTaskSchema.parse(req.body)

  const exists = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
    },
  })

  if (!exists) {
    throw new AppError(404, 'Task not found')
  }

  const task = await prisma.task.update({
    where: {
      id: req.params.id,
    },

    data: {
      columnId: body.columnId,
      order: body.order,
    },
  })

  res.json(task)
})

/**
 * DELETE /api/tasks/:id
 * Soft delete
 */
tasksRouter.delete('/:id', async (req, res) => {
  const exists = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
    },
  })

  if (!exists) {
    throw new AppError(404, 'Task not found')
  }

  await prisma.task.update({
    where: {
      id: req.params.id,
    },

    data: {
      deletedAt: new Date(),
    },
  })

  res.status(204).send()
})