import { execSync } from 'child_process'
import fs from 'fs'

/**
 * Создаёт схему во временной базе по schema.prisma и удаляет базу после прогона
 */
export default function setup() {
  const dbPath = process.env.DB_PATH!
  fs.rmSync(dbPath, { force: true })

  execSync('npx prisma db push --accept-data-loss', {
    cwd: `${__dirname}/..`,
    env: { ...process.env, DB_PATH: dbPath },
    stdio: 'pipe',
  })

  return () => {
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      fs.rmSync(dbPath + suffix, { force: true })
    }
  }
}
