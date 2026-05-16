import {Router} from "express";
import {prisma} from "../db/client";


export const tasksRouter = Router()

tasksRouter.get('/:boardId', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { active: true, boardId: req.params.boardId },
    orderBy: { order: 'asc' },
    omit: { active: true },
  })

  res.json(tasks)
})