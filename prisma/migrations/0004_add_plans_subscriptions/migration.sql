-- CreateTable: plans
CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "max_clients" INTEGER NOT NULL DEFAULT -1,
    "max_searches" INTEGER NOT NULL DEFAULT 20,
    "features" TEXT[] NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "plans_name_key" ON "plans"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "plans_slug_key" ON "plans"("slug");

-- CreateTable: subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_ends_at" TIMESTAMP(3),
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT;

-- Seed plans
INSERT INTO "plans" (id, name, slug, price_cents, max_users, max_clients, max_searches, features) VALUES
(gen_random_uuid()::text, 'Teste Grátis', 'free-trial', 0, 1, 10, 20, ARRAY['7 dias de teste', '1 usuário', '10 clientes', '20 buscas/dia', 'Tarefas básicas']),
(gen_random_uuid()::text, 'Profissional', 'pro', 1990, 2, -1, 100, ARRAY['2 usuários', 'Clientes ilimitados', '100 buscas/dia', 'Tarefas ilimitadas', 'Suporte prioritário']),
(gen_random_uuid()::text, 'Escritório', 'office', 3990, 5, -1, -1, ARRAY['5 usuários', 'Clientes ilimitados', 'Buscas ilimitadas', 'Tarefas ilimitadas', 'Suporte VIP', 'Relatórios avançados'])
ON CONFLICT (slug) DO NOTHING;
