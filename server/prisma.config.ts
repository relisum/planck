import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts"
  },
  datasource: {
    url: `file:${process.env.DB_PATH ?? './dev.db'}`,
  },
})