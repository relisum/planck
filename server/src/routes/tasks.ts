import { Router } from 'express'
import { prisma } from '../db/client'
import { AppError } from '../middleware/errorHandler'
import { CreateTaskSchema, UpdateTaskSchema } from '../types/task.types'
import { randomUUID } from 'crypto'

export const tasksRouter = Router()

// GET /api/tasks/:boardId — все активные таски доски
tasksRouter.get('/:boardId', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where:   { active: true, boardId: req.params.boardId },
    orderBy: { order: 'asc' },
    omit:    { active: true },
  })

  res.json(tasks)
})

// GET /api/tasks/:boardId/:id — одна таска
tasksRouter.get('/:boardId/:id', async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, boardId: req.params.boardId, active: true },
    omit:  { active: true },
  })

  if (!task) throw new AppError(404, `Task "${req.params.id}" not found`)

  res.json(task)
})

tasksRouter.post('/:boardId', async (req, res) => {
  const data = CreateTaskSchema.parse(req.body)

  const count = await prisma.task.count({
    where: { boardId: req.params.boardId, active: true },
  })

  const task = await prisma.task.create({
    data: {
      id:      randomUUID(),
      boardId: req.params.boardId,
      order:   count,
      ...data,
    },
    omit: { active: true },
  })

  res.status(201).json(task)
})

// PATCH /api/tasks/:id — обновить таску (статус, порядок, title, content)
tasksRouter.patch('/:id', async (req, res) => {
  const data = UpdateTaskSchema.parse(req.body)

  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, active: true },
  })
  if (!existing) throw new AppError(404, `Task "${req.params.id}" not found`)

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data,
    omit:  { active: true },
  })

  res.json(task)
})

// DELETE /api/tasks/:id — мягкое удаление
tasksRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, active: true },
  })
  if (!existing) throw new AppError(404, `Task "${req.params.id}" not found`)

  await prisma.task.update({
    where: { id: req.params.id },
    data:  { active: false },
  })

  res.status(204).send()
})