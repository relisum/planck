import {Router} from "express";
import {UpdateTaskSchema} from "../schemas/task.schemas";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";


export const tasksRouter = Router()

tasksRouter.patch('/:taskId/edit', async (req, res) => {
  const { taskId } = req.params
  const { content } = UpdateTaskSchema.parse(req.body)
  const now = new Date()

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      subtasks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" }
      }
    }
  })

  if (!task) throw new AppError(404, "Task not found")

  await prisma.$transaction([
    prisma.column.update({
      where: { id: task.columnId },
      data: { updatedAt: now },
    }),
    prisma.board.update({
      where: { id: task.boardId },
      data: { updatedAt: now },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { content },
    })
  ])

  res.status(200).json({...task, updatedAt: now})
})

tasksRouter.delete('/:taskId/delete', async (req, res) => {
  const { taskId } = req.params
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      subtasks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" }
      }
    }
  })
  const now = new Date()

  if (!task) throw new AppError(404, "Task not found")

  await prisma.$transaction([
    prisma.subtasks.updateMany({
      where: { taskId: taskId },
      data: { deletedAt: now },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: now },
    })
  ])


  res.status(200).json(task)
})