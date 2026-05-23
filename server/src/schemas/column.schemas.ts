import { z } from 'zod'

export const CreateColumnSchema = z.object({
  boardId: z.uuid(),

  title: z.string().min(1).max(120),
})

export const UpdateColumnSchema = z.object({
  title: z.string().min(1).max(120).optional(),
})

export const MoveColumnSchema = z.object({
  fromIndex: z.number().int(),
  toIndex: z.number().int(),
})

export const MoveTaskSchema = z.object({
  fromIndex: z.number().int(),
  toIndex: z.number().int(),
  targetColumnId: z.uuid(),
})

export type CreateColumnInput = z.infer<typeof CreateColumnSchema>
export type UpdateColumnInput = z.infer<typeof UpdateColumnSchema>
export type MoveColumnInput = z.infer<typeof MoveColumnSchema>