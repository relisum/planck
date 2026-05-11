// Типы данных — единственный источник правды.
// Zod-схемы используются и для валидации запросов, и для вывода TypeScript-типов.

import { z } from 'zod'

// ─── Схемы ────────────────────────────────────────────────────────────────────

export const BoardSchema = z.object({
  id:        z.uuid(),
  title:     z.string().min(1).max(100),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/),
  taskCount: z.number().int().min(0),
  createdAt: z.iso.datetime(),
})

// Схема для создания: id и createdAt генерируем на сервере → omit
export const CreateBoardSchema = BoardSchema.omit({ id: true, createdAt: true })

// Схема для обновления: все поля опциональны
export const UpdateBoardSchema = CreateBoardSchema.partial()

// ─── Типы из схем ─────────────────────────────────────────────────────────────

export type Board        = z.infer<typeof BoardSchema>
export type CreateBoard  = z.infer<typeof CreateBoardSchema>
export type UpdateBoard  = z.infer<typeof UpdateBoardSchema>