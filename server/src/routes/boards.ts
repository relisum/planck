import { Router } from 'express'
import { prisma } from '../db/client'


const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA'] as const

import {
  CreateBoardSchema,
  MoveBoardSchema,
  RenameBoardSchema,
  UpdateBoardSchema
} from '../schemas/board.schemas'
import {AppError} from "../middleware/errorHandler";
import {calculateOrder, rebalance} from "../utils/order";

export const boardsRouter = Router()


/**
 * /api/boards/
 * Все доски
 */
boardsRouter.get('/', async (req, res) => {
  const boards = await prisma.board.findMany({
    where: {
      deletedAt: null
    },

    orderBy: [
      { order: 'asc' },
    ],
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
  const { fromIndex, toIndex } = MoveBoardSchema.parse(req.body)
  const { id } = req.params

  const boards = await prisma.board.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const reordered = [...boards]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const prev = reordered[toIndex - 1]
  const next = reordered[toIndex + 1]

  const newOrder = calculateOrder(prev, next)

  if (prev && next && Math.abs(next.order - prev.order) < 1) {
    reordered.splice(toIndex, 1, { ...moved, order: newOrder })

    await rebalance(reordered, (id, order) =>
      prisma.board.update({
        where: { id },
        data: { order }
      }).then(() => {})
    )

    return res.status(200).json({ rebalanced: true })
  }

  const board = await prisma.board.update({
    where: { id },
    data: { order: newOrder },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } }
      }
    }
  })

  res.status(200).json(board)
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
      deletedAt: null
    },

    orderBy: {
      order: "desc"
    }
  })

  const order = lastBoard
    ? lastBoard.order + 1000
    : 1000

  const board = await prisma.board.create({
    data: {
      title: body.title,
      color,
      order
    },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } },
      }
    }
  })

  res.status(201).json(board)
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
      where: { id },
      data: { deletedAt: now },
    })
  ])

  res.status(200).json({ deleted: board.id })
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
      where: { task: { column: { board: { id } } } },
      data: { deletedAt: null },
    }),
    prisma.task.updateMany({
      where: { column: { board: { id } } } ,
      data: { deletedAt: null }
    }),
    prisma.column.updateMany({
      where: { board: { id } },
      data: { deletedAt: null }
    }),
    prisma.board.update({
      where: { id },
      data: { deletedAt: null }
    }),
  ])

  const restored = await prisma.board.findUnique({
    where: { id },
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
  res.status(200).json(restored)
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

  const updated = await prisma.board.update({
    where: { id },
    data: { title },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } }
      }
    }
  })

  res.status(200).json(updated)
})