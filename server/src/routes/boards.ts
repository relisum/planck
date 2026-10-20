import { Router } from 'express'
import { prisma } from '../db/client'


const COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#EF9F27', '#7F77DD', '#E05C5C', '#20B2AA'] as const

import {
  AddMemberSchema,
  CreateBoardSchema,
  MoveBoardSchema,
  RenameBoardSchema,
} from '../schemas/board.schemas'
import {AppError} from "../middleware/errorHandler";
import {rebalanceIfNeeded} from "../utils/order";
import {requireBoardMember, requireBoardOwner} from "../utils/access";

export const boardsRouter = Router()

const boardCounts = {
  _count: {
    select: {
      tasks: { where: { deletedAt: null } },
      members: true,
    }
  }
} as const

const memberSelect = {
  role: true,
  createdAt: true,
  user: { select: { id: true, username: true, displayName: true } },
} as const

type MemberRow = {
  role: string
  createdAt: Date
  user: { id: string; username: string; displayName: string }
}

function toMember({ role, createdAt, user }: MemberRow) {
  return { ...user, role, joinedAt: createdAt }
}

async function nextMemberOrder(userId: string) {
  const last = await prisma.boardMember.findFirst({
    where: { userId },
    orderBy: { order: 'desc' }
  })
  return last ? last.order + 1000 : 1000
}


/**
 * /api/boards/
 * Все доски, в которых участвует пользователь (свои и расшаренные)
 */
boardsRouter.get('/', async (req, res) => {
  const memberships = await prisma.boardMember.findMany({
    where: {
      userId: req.userId,
      board: { deletedAt: null },
    },
    orderBy: { order: 'asc' },
    include: {
      board: { include: boardCounts }
    }
  })

  res.status(200).json(memberships.map(({ board, role, order }) => ({ ...board, order, role })))
})

/**
 * /api/boards/:id/move/
 * Изменение порядка доски (порядок у каждого участника свой)
 */
boardsRouter.patch('/:id/move', async (req, res) => {
  const { id } = req.params
  const { fromIndex, toIndex } = MoveBoardSchema.parse(req.body)

  const memberships = await prisma.boardMember.findMany({
    where: { userId: req.userId, board: { deletedAt: null } },
    orderBy: { order: 'asc' }
  })

  const reordered = memberships.map(m => ({ id: m.boardId, order: m.order }))
  const [moved] = reordered.splice(fromIndex, 1)
  if (!moved) throw new AppError(400, 'Invalid index')
  reordered.splice(toIndex, 0, moved)

  const updateOrder = (boardId: string, order: number) =>
    prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId: req.userId } },
      data: { order }
    }).then(() => {})

  const { order: newOrder, rebalanced } = await rebalanceIfNeeded({
    reordered,
    toIndex,
    moved,
    updateFn: updateOrder
  })

  if (!rebalanced) await updateOrder(id, newOrder)

  res.status(204).send()
})

/**
 * /api/boards/create
 * Создание новой доски, создатель становится владельцем
 */
boardsRouter.post('/', async (req, res) => {
  const body = CreateBoardSchema.parse(req.body)
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const order = await nextMemberOrder(req.userId)

  const created = await prisma.board.create({
    data: {
      title: body.title,
      color,
      order,
      userId: req.userId,
      members: {
        create: { userId: req.userId, role: 'owner', order }
      }
    },
    include: {
      ...boardCounts,
      members: { select: memberSelect },
    }
  })

  res.status(200).json({ ...created, members: created.members.map(toMember), role: 'owner' })
})


/**
 * /api/boards/:id
 * Удаление доски (только владелец)
 */
boardsRouter.delete('/:id/delete', async (req, res) => {
  const { id } = req.params

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null }
  })

  if (!board) throw new AppError(404, 'Board not Found')
  await requireBoardOwner(id, req.userId)

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

  res.status(204).send()
})


/**
 * /api/boards/:id/restore
 * Восстановление удаленной доски (только владелец)
 */
boardsRouter.patch('/:id/restore', async (req, res) => {
  const { id } = req.params

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: { not: null } }
  })

  if (!board) throw new AppError(404, 'Board not found')
  await requireBoardOwner(id, req.userId)

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

  res.status(204).send()
})


/**
 * /boards/api/:id/rename
 * Переименование неудаленной доски (любой участник)
 */
boardsRouter.patch('/:id/rename', async (req, res) => {
  const { id } = req.params
  const { title } = RenameBoardSchema.parse(req.body)

  const board = await prisma.board.findFirst({
    where: { id, deletedAt: null },
  })

  if (!board) throw new AppError(404, 'Board not found')
  await requireBoardMember(id, req.userId)

  await prisma.board.update({
    where: { id },
    data: { title },
  })

  res.status(204).send()
})


/**
 * /api/boards/:id/members
 * Участники доски
 */
boardsRouter.get('/:id/members', async (req, res) => {
  const { id } = req.params
  await requireBoardMember(id, req.userId)

  const members = await prisma.boardMember.findMany({
    where: { boardId: id },
    orderBy: { createdAt: 'asc' },
    select: memberSelect,
  })

  res.status(200).json(members.map(toMember))
})

/**
 * /api/boards/:id/members
 * Добавить участника по логину (только владелец)
 */
boardsRouter.post('/:id/members', async (req, res) => {
  const { id } = req.params
  const { username } = AddMemberSchema.parse(req.body)
  await requireBoardOwner(id, req.userId)

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new AppError(404, 'User not found')

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: id, userId: user.id } }
  })
  if (existing) throw new AppError(409, 'User is already a member')

  const member = await prisma.boardMember.create({
    data: {
      boardId: id,
      userId: user.id,
      role: 'member',
      order: await nextMemberOrder(user.id),
    },
    select: memberSelect,
  })

  res.status(201).json(toMember(member))
})

/**
 * /api/boards/:id/members/:userId
 * Исключить участника (владелец) или покинуть доску (сам участник)
 */
boardsRouter.delete('/:id/members/:userId', async (req, res) => {
  const { id, userId } = req.params
  const role = await requireBoardMember(id, req.userId)

  const isSelf = userId === req.userId
  if (!isSelf && role !== 'owner') throw new AppError(403, 'Only the board owner can do this')

  const target = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: id, userId } }
  })
  if (!target) throw new AppError(404, 'Member not found')
  if (target.role === 'owner') throw new AppError(400, 'Owner cannot leave the board')

  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId: id, userId } }
  })

  res.status(204).send()
})
