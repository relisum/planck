import { prisma } from './client'

/**
 * Делает владельца участником каждой доски, у которой ещё нет записи владельца.
 * Идемпотентно: страхует существующие доски, если схема обновлялась без миграции с бэкфиллом
 * (например, через prisma db push).
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
