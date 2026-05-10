import { db } from './client'
import { createMockBoards } from '../mocks/boards.mock'

export function seedDb(): void {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number }

  if (count > 0) {
    console.log(`ℹ️  DB already has ${count} boards, skipping seed`)
    return
  }

  const boards = createMockBoards(7)

  const insert = db.prepare(`
    INSERT INTO boards (id, title, color, task_count, created_at)
    VALUES (@id, @title, @color, @taskCount, @createdAt)
  `)

  const insertMany = db.transaction((items: typeof boards) => {
    for (const board of items) insert.run(board)
  })

  insertMany(boards)
  console.log(`🌱 Seeded ${boards.length} boards`)
}