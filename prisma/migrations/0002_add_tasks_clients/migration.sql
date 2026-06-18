-- CreateTable: clients
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tasks
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "process_number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Prazo',
    "priority" TEXT NOT NULL DEFAULT 'media',
    "deadline" TIMESTAMP(3),
    "responsible" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "client_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
