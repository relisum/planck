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
}