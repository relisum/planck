import {Router} from "express";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";
import {MoveColumnSchema, RenameColumnSchema} from "../schemas/column.schemas";
import {calculateOrder, rebalance} from "../utils/order";
import {MoveTaskSchema} from "../schemas/task.schemas";


export const boardRouter = Router()

/**
 * /api/board/:id
 * Получить конкретную неудаленную доску с колонками и заданиями
 */
boardRouter.get('/:id', async (req, res) => {
  const { id } = req.params

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null },
    include: {
      columns: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })

  if (!board) throw new AppError(404, 'Board not found')

  res.status(200).json(board)
})

/**
 * /api/board/:boardId/columns/move/:columnId
 * Перемещение колонки
 */
boardRouter.patch('/:boardId/columns/:columnId/move', async (req, res) => {
  const { boardId, columnId } = req.params
  const { fromIndex, toIndex } = MoveColumnSchema.parse(req.body)

  const columns = await prisma.column.findMany({
    where: { boardId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const reordered = [...columns]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const prev = reordered[toIndex - 1]
  const next = reordered[toIndex + 1]

  const newOrder = calculateOrder(prev, next)

  if (prev && next && Math.abs(next.order - prev.order) < 1) {
    reordered.splice(toIndex, 1, { ...moved, order: newOrder })

    await rebalance(reordered, (id, order) =>
      prisma.column.update({ where: { id }, data: { order } }).then(() => {})
    )

    return res.status(200).json({ rebalanced: true })
  }

  await prisma.column.update({ where: { id: columnId }, data: { order: newOrder } })
  res.status(200).json({ order: newOrder })
})

/**
 * GET /api/board/columns/create
 * Все таски доски
 */
boardRouter.post('/:boardId/columns/create', async (req, res) => {
  const { boardId } = req.params
  // const { title } = CreateColumnSchema.parse(req.body)

  const lastColumn = await prisma.column.findFirst({
    where: { boardId, deletedAt: null },
    orderBy: { order: 'desc' }
  })

  const order = lastColumn ? lastColumn.order + 1000 : 1000

  const column = await prisma.column.create({
    data: { boardId, title: 'Новая доска', order }
  })

  res.status(201).json(column)
})

/**
 * /api/board/:boardId/tasks/:taskId/move
 */
boardRouter.patch('/:boardId/tasks/:taskId/move', async (req, res) => {
  const { boardId, taskId } = req.params
  const { toIndex, targetColumnId } = MoveTaskSchema.parse(req.body)

  const tasks = await prisma.task.findMany({
    where: { boardId, columnId: targetColumnId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const otherTasks = tasks.filter(t => t.id !== taskId)

  const prev = otherTasks[toIndex - 1]
  const next = otherTasks[toIndex]

  const newOrder = calculateOrder(prev, next)

  if (prev && next && Math.abs(next.order - prev.order) < 1) {
    const reordered = [...otherTasks]
    reordered.splice(toIndex, 0, { id: taskId } as any)

    await rebalance(reordered, (id, order) =>
      prisma.task.update({ where: { id }, data: { order } }).then(() => {})
    )

    return res.status(200).json({ rebalanced: true })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { order: newOrder, columnId: targetColumnId }
  })

  res.status(200).json({ order: newOrder })
})

/**
 * /api/board/columns/:columnId/rename
 * Переименовать колонку
 */
boardRouter.patch('/columns/:columnId/rename', async (req, res) => {
  const { columnId } = req.params
  const { title } = RenameColumnSchema.parse(req.body)

  const column = await prisma.column.findFirst({
    where: { id: columnId, deletedAt: null }
  })

  if (!column) throw new AppError(404, 'Column not found')

  const updated = await prisma.column.update({
    where: { id: columnId },
    data: { title }
  })

  res.status(200).json(updated)
})

/**
 * /api/board/columns/:columnId/delete
 * Удалить колонку
 */
boardRouter.delete('/columns/:columnId/delete', async (req, res) => {
  const { columnId } = req.params

  const column = await prisma.column.findFirst({where: { id: columnId }})

  if (!column) throw new AppError(404, 'Column not found')

  const now = new Date()

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { columnId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: now },
    })
  ])

  res.status(200).send({ deleted: columnId })
})

/**
 * /api/board/columns/:columnId/restore
 * Восстановить удаленную колону
 */
boardRouter.patch('/columns/:columnId/restore', async (req, res) => {
  const { columnId } = req.params

  const column = await prisma.column.findFirst({where: { id: columnId }})

  if (!column) throw new AppError(404, 'Column not found')

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { columnId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: null },
    })
  ])

  res.status(200).json({ restoredId: columnId })
})