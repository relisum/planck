/*
  Warnings:

  - You are about to drop the column `due_date` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "board_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "order" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "tasks_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "columns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("board_id", "column_id", "content", "created_at", "deleted_at", "id", "order", "task_id", "updated_at") SELECT "board_id", "column_id", "content", "created_at", "deleted_at", "id", "order", "task_id", "updated_at" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_board_id_idx" ON "tasks"("board_id");
CREATE INDEX "tasks_column_id_idx" ON "tasks"("column_id");
CREATE INDEX "tasks_order_idx" ON "tasks"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
