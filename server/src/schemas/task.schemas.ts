import { z } from 'zod'

export const CreateTaskSchema = z.object({
  boardId: z.uuid(),

  columnId: z.uuid(),

  // title: z.string().min(1).max(240),

  content: z.string().max(10000).default(''),
})

export const UpdateTaskSchema = z.object({
  content: z.string().max(10000).optional(),
})

export const MoveTaskSchema = z.object({
  toIndex: z.number().int(),
  targetColumnId: z.uuid(),
})