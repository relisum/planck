-- CreateTable
CREATE TABLE "board_members" (
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "order" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("board_id", "user_id"),
    CONSTRAINT "board_members_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "board_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "board_members_user_id_idx" ON "board_members"("user_id");

-- Backfill: владелец каждой существующей доски становится её участником с ролью owner
INSERT INTO "board_members" ("board_id", "user_id", "role", "order", "created_at")
SELECT "id", "user_id", 'owner', "order", "created_at" FROM "boards";
