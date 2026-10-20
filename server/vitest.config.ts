import { defineConfig } from 'vitest/config'
import os from 'os'
import path from 'path'

// Отдельная временная SQLite-база на каждый запуск тестов
const DB_PATH = path.join(os.tmpdir(), `planck-test-${process.pid}.db`)
process.env.DB_PATH = DB_PATH

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: './tests/globalSetup.ts',
    fileParallelism: false,
    env: {
      DB_PATH,
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
    },
  },
})
