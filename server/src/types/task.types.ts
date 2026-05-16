// ─── Схемы ────────────────────────────────────────────────────────────────────

import {BoardSchema, CreateBoardSchema} from "./board.types";
import {z} from "zod";


export const TaskSchema = z.object({
  id:        z.uuid(),
  title:     z.string().min(1).max(100),
  content:   z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  boardId:   z.uuid(),
  status:    z.string(),
  order:     z.number(),
  active:    z.boolean(),
})

// Схема для создания: id и createdAt генерируем на сервере → omit
export const CreateTaskSchema = BoardSchema.omit({ id: true, createdAt: true })

// Схема для обновления: все поля опциональны
export const UpdateTaskSchema = CreateBoardSchema.partial()

// ─── Типы из схем ─────────────────────────────────────────────────────────────

export type Task        = z.infer<typeof TaskSchema>
export type CreateTask  = z.infer<typeof CreateTaskSchema>
export type UpdateTask  = z.infer<typeof UpdateTaskSchema>