import { Router } from 'express'
import { prisma } from '../db/client'
import { AppError } from '../middleware/errorHandler'

import {
  CreateBoardSchema,
  MoveBoardSchema,
  UpdateBoardSchema
} from '../schemas/board.schemas'

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
    ]
  })

  res.status(200).json(boards)
})

/**
 * /api/boards/:id/move/
 * Изменение порядка доски
 */
boardsRouter.patch('/move/:id', async (req, res) => {
  const { fromIndex, toIndex } = MoveBoardSchema.parse(req.body)
  const { id } = req.params

  const boards = await prisma.board.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' }
  })

  // Симулируем перемещение на актуальных данных с сервера
  const reordered = [...boards]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const prev = reordered[toIndex - 1]
  const next = reordered[toIndex + 1]

  let newOrder: number

  if (!prev) {
    newOrder = next!.order / 2
  } else if (!next) {
    newOrder = prev.order + 1000
  } else {
    newOrder = (prev.order + next.order) / 2
  }

  const needsRebalance = prev && next && Math.abs(next.order - prev.order) < 1

  if (needsRebalance) {
    reordered.splice(toIndex, 1, { ...moved, order: newOrder })

    await prisma.$transaction(
      reordered.map((b, i) =>
        prisma.board.update({
          where: { id: b.id },
          data: { order: (i + 1) * 1000 }
        })
      )
    )

    return res.status(200).json({ rebalanced: true })
  }

  const board = await prisma.board.update({
    where: { id },
    data: { order: newOrder }
  })

  res.status(200).json(board)
})

/**
 * /api/boards/create
 * Создание новой доски
 */
boardsRouter.post('/create', async (req, res) => {
  const body = CreateBoardSchema.parse(req.body)

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
      color: body.color,
      order
    }
  })

  res.status(201).json(board)
})