import { Router } from 'express'
import { prisma } from '../db/client'

import {
  CreateTaskSchema,
} from '../schemas/column.schemas'
import {AppError} from "../middleware/errorHandler";
import {requireColumnAccess} from "../utils/access";
import {notifyBoard} from "../realtime/events";

export const columnRouter = Router()

/**
 * /api/:columnId/tasks
 * Получить задачи колонки по Id
 */
columnRouter.get('/:columnId/tasks', async (req, res) => {
  const { columnId } = req.params
  await requireColumnAccess(columnId, req.userId)

  const tasks = await prisma.task.findMany({
    where: { columnId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  res.status(200).json(tasks)
})

/**
 * POST
 * /column/:columnId/task/create
 * Создание задачи
 */
columnRouter.post('/:columnId/tasks/create', async (req, res) => {
  const { columnId } = req.params
  const { content } = CreateTaskSchema.parse(req.body)

  const column = await requireColumnAccess(columnId, req.userId)
  if (column.deletedAt) throw new AppError(404, 'Column not found')
  const { boardId } = column

  const lastTask = await prisma.task.findFirst({
    where: { columnId, deletedAt: null },
    orderBy: { order: 'desc' }
  })

  const lastTaskId = await prisma.task.findFirst({
    where: { boardId: column.boardId, deletedAt: null },
    orderBy: { taskId: 'desc' }
  })

  const task = await prisma.task.create({
    data: {
      boardId: column.boardId,
      columnId,
      taskId: (lastTaskId?.taskId ?? 0) + 1,
      content,
      order: (lastTask?.order ?? 0) + 1000
    }
  })

  await notifyBoard(req, boardId)
  res.status(201).json(task)
})