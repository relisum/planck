import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import { PrismaClient } from "@prisma/client"

const DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH ?? 'dev.db')

const adapter = new PrismaBetterSqlite3({
  url: `file:${DB_PATH}`,
})

export const prisma = new PrismaClient({ adapter })

export async function initDb(): Promise<void> {
  await prisma.$connect()
  console.log('✅ DB connected:', DB_PATH)

  const restored = await backfillBoardOwners()
  if (restored > 0) console.log(`👥 Board owners backfilled: ${restored}`)
}

/**
 * Делает владельца участником каждой доски, у которой ещё нет записи владельца.
 * Идемпотентно: страхует существующие доски, если схема обновлялась без миграции с бэкфиллом.
 */
export async function backfillBoardOwners(): Promise<number> {
  return prisma.$executeRaw`
    INSERT INTO "board_members" ("board_id", "user_id", "role", "order", "created_at")
    SELECT b."id", b."user_id", 'owner', b."order", b."created_at"
    FROM "boards" b
    WHERE NOT EXISTS (
      SELECT 1 FROM "board_members" m
      WHERE m."board_id" = b."id" AND m."user_id" = b."user_id"
    )
  `
}