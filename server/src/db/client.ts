import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), 'dev.db')

// better-sqlite3 принимает просто путь к файлу, не объект с url
export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      color      TEXT NOT NULL,
      task_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `)
  console.log('✅ DB initialized:', DB_PATH)
}