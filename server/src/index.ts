import 'dotenv/config'
import { initDb } from './db/client'
import { createApp } from './app'


const app = createApp()
const PORT = process.env.PORT ?? 3000

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
