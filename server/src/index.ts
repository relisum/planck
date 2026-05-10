// Точка входа сервера.
// Порядок важен: сначала middleware, потом роуты, в конце errorHandler.

import express from 'express'
import cors from 'cors'
import { initDb } from './db/client'
import { seedDb } from './db/seed'
import { boardsRouter } from './routes/boards'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT ?? 3000

// ─── Middleware ────────────────────────────────────────────────────────────────

// Разрешаем запросы с фронта (localhost:5173 — дефолтный порт Vite)
app.use(cors({ origin: 'http://localhost:5173' }))

// Парсим JSON-body запросов — без этого req.body будет undefined
app.use(express.json())

// ─── Роуты ────────────────────────────────────────────────────────────────────

app.use('/api/boards', boardsRouter)

// Health check — полезно для деплоя и мониторинга
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Обработка ошибок — ВСЕГДА последний middleware ───────────────────────────
app.use(errorHandler)

// ─── Старт ────────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    await initDb()   // создаём таблицы
    await seedDb()   // заполняем данными если пусто
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
      console.log(`📋 Boards API:  http://localhost:${PORT}/api/boards`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

bootstrap()