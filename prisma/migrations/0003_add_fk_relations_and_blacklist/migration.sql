-- CreateTable: refresh_token_blacklist
CREATE TABLE IF NOT EXISTS "refresh_token_blacklist" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_blacklist_token_hash_key" ON "refresh_token_blacklist"("token_hash");

-- AddForeignKey: clients.user_id → users.id
ALTER TABLE "clients"
ADD CONSTRAINT "clients_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tasks.user_id → users.id
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
