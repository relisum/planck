import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/client'
import { errorHandler } from './middleware/errorHandler'
import {boardsRouter} from "./routes/boards"
import {boardRouter} from "./routes/board"
import {columnRouter} from "./routes/column"
import {tasksRouter} from "./routes/tasks"
import cookieParser from 'cookie-parser'
import {authMiddleware} from "./middleware/auth";
import {authRouter} from "./routes/auth";


const app = express()
const PORT = process.env.PORT ?? 3000


app.use(cors({
  origin: process.env.ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)

app.use(authMiddleware)

app.use('/api/boards', boardsRouter)
app.use('/api/board', boardRouter)
app.use('/api/column', columnRouter)
app.use('/api/tasks', tasksRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

async function bootstrap() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
      console.log(`📋 Boards API:  http://localhost:${PORT}/api/boards`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

(async () => await bootstrap())()