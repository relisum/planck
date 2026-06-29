import {Router} from "express";
import {ChangePriorityTaskSchema, UpdateTaskSchema} from "../schemas/task.schemas";
import {prisma} from "../db/client";
import {AppError} from "../middleware/errorHandler";
import {
  ChangeSubtaskSchema,
  CreateSubtaskSchema,
  MoveSubtaskSchema,
  ToggleSubtaskSchema
} from "../schemas/subtask.schemas";
import {rebalanceIfNeeded} from "../utils/order";


export const tasksRouter = Router()

/**
 * /api/tasks/:taskId/edit
 * Изменение описания задачи
 */
tasksRouter.patch('/:taskId/edit', async (req, res) => {
  const { taskId } = req.params
  const { content } = UpdateTaskSchema.parse(req.body)

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

  await prisma.task.update({
    where: { id: taskId },
    data: { content },
  })


  res.status(204).send()
})

/**
 * /api/tasks/:taskId/delete
 * Удаление задачи
 */
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

  res.status(204).send()
})

/**
 * /api/tasks/:taskId/priority
 * Change task's priority
 */
tasksRouter.patch('/:taskId/priority', async (req, res) => {
  const { taskId } = req.params
  const { priority } = ChangePriorityTaskSchema.parse(req.body)

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  })
  if (!task) throw new AppError(404, "Task not found")

  await prisma.task.update({
    where: { id: taskId },
    data: { priority },
  })

  res.status(204).send()
})

/**
 * /api/tasks/subtasks/:subtaskId/toggle
 * Переключить выполнение подзадачи
 */
tasksRouter.patch('/subtasks/:subtaskId/toggle', async (req, res) => {
  const { subtaskId } = req.params
  const { done } = ToggleSubtaskSchema.parse(req.body)

  const subtask = await prisma.subtasks.findFirst({
    where: { id: subtaskId, deletedAt: null },
  })

  if (!subtask) throw new AppError(404, "Subtask not found")

  await prisma.subtasks.update({
    where: { id: subtaskId },
    data: { done }
  })

  res.status(204).send()
})

/**
 * /api/tasks/:taskId/subtasks/:subtaskId/move
 * Перемещение подзадачи
 */
tasksRouter.patch('/:taskId/subtasks/:subtaskId/move', async (req, res) => {
  const { taskId, subtaskId } = req.params
  const { fromIndex, toIndex } = MoveSubtaskSchema.parse(req.body)

  const subtasks = await prisma.subtasks.findMany({
    where: { taskId: taskId, deletedAt: null },
    orderBy: { order: 'asc' }
  })

  const reordered = [...subtasks]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  const { order: newOrder, rebalanced } = await rebalanceIfNeeded({
    reordered,
    toIndex,
    moved,
    updateFn: (id, order) =>
      prisma.subtasks.update(
        {where: {id}, data: {order}}
      ).then()
  })

  if (rebalanced) {
    return res.status(204)
  }

  await prisma.subtasks.update({
    where: { id: subtaskId },
    data: { order: newOrder },
  })

  res.status(204).send()
})

/**
 * /api/tasks/:taskId/subtasks/create
 * Создание новой подзадачи
 */
tasksRouter.post('/:taskId/subtasks/create', async (req, res) => {
  const { taskId } = req.params
  const { content } = CreateSubtaskSchema.parse(req.body)

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  })
  if (!task) throw new AppError(404, "Task not found")

  const lastSubtask = await prisma.subtasks.findFirst({
    where: { taskId },
    orderBy: { order: 'desc' }
  })

  const created = await prisma.subtasks.create({
    data: {
      taskId,
      order: lastSubtask?.order ? lastSubtask.order + 1000 : 1000,
      content
    }
  })

  res.status(200).json(created)
})

/**
 * /api/tasks/subtasks/:subtaskId/change
 * Изменение текста подзадачи
 */
tasksRouter.patch('/subtasks/:subtaskId/change', async (req, res) => {
  const { subtaskId } = req.params
  const { content } = ChangeSubtaskSchema.parse(req.body)

  const subtask = await prisma.subtasks.findFirst({
    where: { id: subtaskId, deletedAt: null },
  })

  if (!subtask) throw new AppError(404, "Subtask not found")

  await prisma.subtasks.update({
      where: { id: subtaskId },
      data: { content }
    })

  res.status(200).json({...subtask, content})
})

/**
 * /api/tasks/subtasks/:subtaskId/delete
 * Удаление подзадачи
 */
tasksRouter.delete('/subtasks/:subtaskId/delete', async (req, res) => {
  const { subtaskId } = req.params
  const now = new Date()

  const subtask = await prisma.subtasks.findFirst({
    where: { id: subtaskId, deletedAt: null },
  })
  if (!subtask) throw new AppError(404, "Subtask not found")

  await prisma.subtasks.update({
    where: { id: subtaskId },
    data: { deletedAt: now }
  })

  return res.status(204).send()
})

/**
 * /api/tasks/:taskId/toggle
 * Переключение выполнения задачи
 */
tasksRouter.patch('/:taskId/toggle', async (req, res) => {
  const { taskId } = req.params
  const { done } = ToggleSubtaskSchema.parse(req.body)
  const now = new Date()

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  })

  if (!task) throw new AppError(404, "Task not found")

  await prisma.task.update({
    where: { id: taskId },
    data: { done: !done, updatedAt: now }
  })

  return res.status(204).send()
})