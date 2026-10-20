import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middleware/errorHandler'
import {boardsRouter} from "./routes/boards"
import {boardRouter} from "./routes/board"
import {columnRouter} from "./routes/column"
import {tasksRouter} from "./routes/tasks"
import {authMiddleware} from "./middleware/auth";
import {authRouter} from "./routes/auth";


export function createApp() {
  const app = express()

  app.use(cors({
    origin: process.env.ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/auth', authRouter)

  app.use(authMiddleware)

  app.use('/api/boards', boardsRouter)
  app.use('/api/board', boardRouter)
  app.use('/api/column', columnRouter)
  app.use('/api/tasks', tasksRouter)

  app.use(errorHandler)

  return app
}
