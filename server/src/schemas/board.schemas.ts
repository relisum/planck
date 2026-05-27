import { z } from 'zod'

export const CreateBoardSchema = z.object({
  title: z.string().min(1).max(120),
})

export const UpdateBoardSchema = z.object({
  title: z.string().min(1).max(120).optional(),

  color: z.string().min(1).max(30).optional(),
})

export const MoveBoardSchema = z.object({
  fromIndex: z.number().int(),
  toIndex: z.number().int(),
})

export const RenameBoardSchema = z.object({
  title: z.string().min(1).max(120),
})