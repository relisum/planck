import {Router} from "express";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";
import {MoveColumnSchema, RenameColumnSchema} from "../schemas/column.schemas";
import {calculateOrder, rebalance, rebalanceIfNeeded} from "../utils/order";
import {MoveTaskSchema} from "../schemas/task.schemas";
import {requireBoardMember, requireColumnAccess, requireTaskAccess} from "../utils/access";
import {notifyBoard} from "../realtime/events";


export const boardRouter = Router()

/**
 * /api/board/:id
 * Получить конкретную неудаленную доску с колонками и заданиями
 */
boardRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const role = await requireBoardMember(id, req.userId)

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null },
    include: {
      members: {
        orderBy: { createdAt: 'asc' },
        select: {
          role: true,
          createdAt: true,
          user: { select: { id: true, username: true, displayName: true } },
        }
      },
      columns: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            include: {
              subtasks: {
                where: { deletedAt: null },
                orderBy: { order: "asc" }
              }
            }
          }
        }
      }
    }
  })

  if (!board) throw new AppError(404, 'Board not found')

  const members = board.members.map(({ role, createdAt, user }) => ({ ...user, role, joinedAt: createdAt }))

  res.status(200).json({ ...board, members, role })
})

/**
 * /api/board/:boardId/columns/move/:columnId
 * Перемещение колонки
 */
boardRouter.patch('/:boardId/columns/:columnId/move', async (req, res) => {
  const { boardId, columnId } = req.params
  const { fromIndex, toIndex } = MoveColumnSchema.parse(req.body)
  await requireBoardMember(boardId, req.userId)

  const columns = await prisma.column.findMany({
    where: { boardId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const reordered = [...columns]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const { order: newOrder, rebalanced } = await rebalanceIfNeeded({
    reordered,
    toIndex,
    moved,
    updateFn: (id, order) => prisma.column.update(
      { where: { id }, data: { order } }
    ).then()
  })

  if (rebalanced) {
    await notifyBoard(req, boardId)
    return res.status(204).send()
  }

  await prisma.column.update({
    where: { id: columnId },
    data: {
      order: newOrder,
    }
  })

  await notifyBoard(req, boardId)
  res.status(204).send()
})

/**
 * GET /api/board/columns/create
 * Все таски доски
 */
boardRouter.post('/:boardId/columns/create', async (req, res) => {
  const { boardId } = req.params
  await requireBoardMember(boardId, req.userId)

  const lastColumn = await prisma.column.findFirst({
    where: { boardId, deletedAt: null },
    orderBy: { order: 'desc' }
  })

  const order = lastColumn ? lastColumn.order + 1000 : 1000

  const column = await prisma.column.create({
    data: { boardId, title: 'Новая колонка', order }
  })

  await notifyBoard(req, boardId)
  res.status(201).json(column)
})

/**
 * /api/board/:boardId/tasks/:taskId/move
 * Перемещение задачи
 */
boardRouter.patch('/:boardId/tasks/:taskId/move', async (req, res) => {
  const { boardId, taskId } = req.params
  const { toIndex, targetColumnId } = MoveTaskSchema.parse(req.body)
  await requireBoardMember(boardId, req.userId)
  const task = await requireTaskAccess(taskId, req.userId)
  const targetColumn = await requireColumnAccess(targetColumnId, req.userId)
  if (task.boardId !== boardId || targetColumn.boardId !== boardId) throw new AppError(400, 'Task and column must belong to the board')

  const tasks = await prisma.task.findMany({
    where: { boardId, columnId: targetColumnId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const otherTasks = tasks.filter((t: any) => t.id !== taskId)

  const prev = otherTasks[toIndex - 1]
  const next = otherTasks[toIndex]

  const newOrder = calculateOrder(prev, next)

  if (prev && next && Math.abs(next.order - prev.order) < 1) {
    const reordered = [...otherTasks]
    reordered.splice(toIndex, 0, { id: taskId } as any)

    await rebalance(reordered, (id, order) =>
      prisma.task.update({ where: { id }, data: { order } }).then(() => {})
    )

    await notifyBoard(req, boardId)
    return res.status(200).json({ rebalanced: true })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { order: newOrder, columnId: targetColumnId },
  })

  await notifyBoard(req, boardId)
  res.status(204).send()
})

/**
 * /api/board/columns/:columnId/rename
 * Переименовать колонку
 */
boardRouter.patch('/columns/:columnId/rename', async (req, res) => {
  const { columnId } = req.params
  const { title } = RenameColumnSchema.parse(req.body)

  const column = await requireColumnAccess(columnId, req.userId)
  if (column.deletedAt) throw new AppError(404, 'Column not found')
  const { boardId } = column

  await prisma.column.update({
    where: { id: columnId },
    data: { title }
  })

  await notifyBoard(req, boardId)
  res.status(204).send()
})

/**
 * /api/board/columns/:columnId/delete
 * Удалить колонку
 */
boardRouter.delete('/columns/:columnId/delete', async (req, res) => {
  const { columnId } = req.params
  const now = new Date()

  const { boardId } = await requireColumnAccess(columnId, req.userId)

  await prisma.$transaction([
    prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: now },
    }),
    prisma.task.updateMany({
      where: { columnId },
      data: { deletedAt: now },
    }),
    prisma.subtasks.updateMany({
      where: { task: { columnId } },
      data: { deletedAt: now }
    })
  ])

  await notifyBoard(req, boardId)
  res.status(204).send()
})

/**
 * /api/board/columns/:columnId/restore
 * Восстановить удаленную колону
 */
boardRouter.patch('/columns/:columnId/restore', async (req, res) => {
  const { columnId } = req.params

  const { boardId } = await requireColumnAccess(columnId, req.userId)

  await prisma.$transaction([
    prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: null },
    }),
    prisma.task.updateMany({
      where: { columnId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    prisma.subtasks.updateMany({
      where: { task: { columnId }, deletedAt: { not: null } },
      data: { deletedAt: null }
    })
  ])

  await notifyBoard(req, boardId)
  res.status(204).send()
})