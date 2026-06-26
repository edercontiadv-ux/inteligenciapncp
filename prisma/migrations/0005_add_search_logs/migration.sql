-- CreateTable: search_logs
CREATE TABLE IF NOT EXISTS "search_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "search_logs_user_id_created_at_idx" ON "search_logs"("user_id", "created_at");
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
