import { z } from 'zod'

export const TaskSchema = z.object({
  id:        z.string().uuid(),
  title:     z.string().min(1).max(100),
  content:   z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  boardId:   z.string().uuid(),
  status:    z.enum(['todo', 'in_progress', 'done']).default('todo'),
  order:     z.number().int().min(0),
  active:    z.boolean(),
})

export const CreateTaskSchema = TaskSchema.omit({
  id: true, createdAt: true, updatedAt: true, active: true, boardId: true, order: true
})

export const UpdateTaskSchema = TaskSchema.omit({
  id: true, createdAt: true, boardId: true
}).partial()

export type Task        = z.infer<typeof TaskSchema>
export type CreateTask  = z.infer<typeof CreateTaskSchema>
export type UpdateTask  = z.infer<typeof UpdateTaskSchema>