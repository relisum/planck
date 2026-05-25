import {Router} from "express";
import {UpdateTaskSchema} from "../schemas/task.schemas";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";


export const tasksRouter = Router()

tasksRouter.patch('/:taskId/edit', async (req, res) => {
  const { taskId } = req.params
  const { content } = UpdateTaskSchema.parse(req.body)

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  })

  if (!task) throw new AppError(404, "Task not found")

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { content },
  })

  res.status(200).json(updated)
})