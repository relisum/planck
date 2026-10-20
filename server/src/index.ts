import 'dotenv/config'
import { initDb } from './db/client'
import { backfillBoardOwners } from './db/backfill'
import { createApp } from './app'


const app = createApp()
const PORT = process.env.PORT ?? 3000

async function bootstrap() {
  try {
    await initDb()

    const restored = await backfillBoardOwners()
    if (restored > 0) console.log(`👥 Board owners backfilled: ${restored}`)

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
