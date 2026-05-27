import { z } from 'zod'

export const CreateColumnSchema = z.object({
  title: z.string().min(1).max(120)
})

export const UpdateColumnSchema = z.object({
  title: z.string().min(1).max(120).optional(),
})

export const RenameColumnSchema = z.object({
  title: z.string().min(1).max(120).optional(),
})

export const MoveColumnSchema = z.object({
  fromIndex: z.number().int(),
  toIndex: z.number().int(),
})

export const CreateTaskSchema = z.object({
  content: z.string().default(''),
})