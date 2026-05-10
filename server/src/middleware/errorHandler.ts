// Централизованный обработчик ошибок.
// В Express он отличается от обычного middleware — принимает 4 аргумента (err, req, res, next).
// Все необработанные throw попадают сюда автоматически (в Express 5).

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod кидает ZodError при провале валидации — возвращаем 400 с деталями
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      issues: err.issues.map((i) => ({
        field:   i.path.join('.'),
        message: i.message,
      })),
    })
    return
  }

  // Кастомные ошибки с кодом
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  // Всё остальное — 500
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}

// Простой класс для ошибок с HTTP-статусом
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}