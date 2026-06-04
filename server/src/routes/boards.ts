import { Router } from 'express'
import { prisma } from '../db/client'


const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA'] as const

import {
  CreateBoardSchema,
  MoveBoardSchema,
  RenameBoardSchema,
} from '../schemas/board.schemas'
import {AppError} from "../middleware/errorHandler";
import {rebalanceIfNeeded} from "../utils/order";

export const boardsRouter = Router()


/**
 * /api/boards/
 * Все доски
 */
boardsRouter.get('/', async (req, res) => {
  const boards = await prisma.board.findMany({
    where: {
      deletedAt: null,
      userId: req.userId
    },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } }
      }
    }
  })
  res.status(200).json(boards)
})

/**
 * /api/boards/:id/move/
 * Изменение порядка доски
 */
boardsRouter.patch('/:id/move', async (req, res) => {
  const { id } = req.params
  const { fromIndex, toIndex } = MoveBoardSchema.parse(req.body)

  const boards = await prisma.board.findMany({
    where: { deletedAt: null, userId: req.userId },
    orderBy: { order: 'asc' }
  })

  const reordered = [...boards]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const { order: newOrder } = await rebalanceIfNeeded({
    reordered,
    toIndex,
    moved,
    updateFn: (id, order) =>
      prisma.board.update({
        where: { id },
        data: { order }
      }).then()
  })

  await prisma.board.update({
    where: { id },
    data: {
      order: newOrder,
      userId: req.userId
    },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } }
      }
    }
  })

  res.status(204).send()
})

/**
 * /api/boards/create
 * Создание новой доски
 */
boardsRouter.post('/', async (req, res) => {
  const body = CreateBoardSchema.parse(req.body)
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]

  const lastBoard = await prisma.board.findFirst({
    where: {
      deletedAt: null,
      userId: req.userId
    },

    orderBy: {
      order: "desc"
    }
  })

  const order = lastBoard
    ? lastBoard.order + 1000
    : 1000

  const created = await prisma.board.create({
    data: {
      title: body.title,
      color,
      order,
      userId: req.userId
    },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } },
      }
    }
  })

  res.status(200).json(created)
})


/**
 * /api/boards/:id
 * Удаление доски
 */
boardsRouter.delete('/:id/delete', async (req, res) => {
  const { id } = req.params

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null }
  })

  if (!board) throw new AppError(404, 'Board not Found')

  const now = new Date()

  await prisma.$transaction([
    prisma.subtasks.updateMany({
      where: { task: { column: { board: { id } } } },
      data: { deletedAt: now },
    }),
    prisma.task.updateMany({
      where: { column: { board: { id } } },
      data: { deletedAt: now }
    }),
    prisma.column.updateMany({
      where: { board: { id } },
      data: { deletedAt: now },
    }),
    prisma.board.update({
      where: { id, userId: req.userId },
      data: { deletedAt: now },
    })
  ])

  res.status(204).send()
})


/**
 * /api/boards/:id/restore
 * Восстановление удаленной доски
 */
boardsRouter.patch('/:id/restore', async (req, res) => {
  const { id } = req.params

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: { not: null } }
  })

  if (!board) throw new AppError(404, 'Board not found')

  await prisma.$transaction([
    prisma.subtasks.updateMany({
      where: { task: { column: { board: { id, userId: req.userId } } } },
      data: { deletedAt: null },
    }),
    prisma.task.updateMany({
      where: { column: { board: { id, userId: req.userId } } } ,
      data: { deletedAt: null }
    }),
    prisma.column.updateMany({
      where: { board: { id, userId: req.userId } },
      data: { deletedAt: null }
    }),
    prisma.board.update({
      where: { id, userId: req.userId },
      data: { deletedAt: null }
    }),
  ])

  await prisma.board.findUnique({
    where: { id, userId: req.userId },
    include: {
      _count: {
        select: {
          tasks: {
            where: { deletedAt: null },
          }
        }
      }
    }
  })
  res.status(204).send()
})


/**
 * /boards/api/:id/rename
 * Переименование неудаленной доски
 */
boardsRouter.patch('/:id/rename', async (req, res) => {
  const { id } = req.params
  const { title } = RenameBoardSchema.parse(req.body)

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null },
  })

  if (!board) throw new AppError(404, 'Board not found')

  await prisma.board.update({
    where: { id, userId: req.userId },
    data: { title },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } }
      }
    }
  })

  res.status(204).send()
})