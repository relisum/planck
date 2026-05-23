import {Router} from "express";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";
import {MoveColumnSchema, MoveTaskSchema} from "../schemas/column.schemas";


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

// Перемещение колонки внутри доски
boardRouter.patch('/:boardId/columns/move/:columnId', async (req, res) => {
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

  const newOrder = !prev
    ? next!.order / 2
    : !next
      ? prev.order + 1000
      : (prev.order + next.order) / 2

  await prisma.column.update({ where: { id: columnId }, data: { order: newOrder } })
  res.status(200).json({ order: newOrder })
})

// Перемещение задачи (в том числе между колонками)
boardRouter.patch('/:boardId/tasks/move/:taskId', async (req, res) => {
  const { boardId, taskId } = req.params
  const { fromIndex, toIndex, targetColumnId } = MoveTaskSchema.parse(req.body)

  const tasks = await prisma.task.findMany({
    where: { boardId, columnId: targetColumnId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  // При перемещении между колонками fromIndex не используется —
  // вставляем в нужную позицию в targetColumn
  const prev = tasks[toIndex - 1]
  const next = tasks[toIndex]

  const newOrder = !prev
    ? (next?.order ?? 1000) / 2
    : !next
      ? prev.order + 1000
      : (prev.order + next.order) / 2

  await prisma.task.update({
    where: { id: taskId },
    data: { order: newOrder, columnId: targetColumnId }
  })

  res.status(200).json({ order: newOrder })
})