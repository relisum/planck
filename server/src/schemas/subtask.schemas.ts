import {z} from "zod";


export const CreateSubtaskSchema = z.object({
  content: z.string().default(''),
})

export const ChangeSubtaskSchema = z.object({
  content: z.string().default(''),
})

export const ToggleSubtaskSchema = z.object({
  done: z.boolean()
})

export const MoveSubtaskSchema = z.object({
  fromIndex: z.number(),
  toIndex: z.number(),
})

export const ChangeTaskDateSchema = z.object({
  date: z.union([z.coerce.date(), z.null()])
})