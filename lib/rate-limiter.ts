import { prisma } from '@/lib/prisma';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

async function ensureRateLimitTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        count INTEGER NOT NULL DEFAULT 1,
        reset_at TIMESTAMP(3) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // table may already exist or db is down — swallow
  }
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  await ensureRateLimitTable();

  const now = new Date();
  const key = `rl:${ip}`;

  const rows = await prisma.$queryRaw<Array<{ count: bigint; reset_at: Date }>>`
    INSERT INTO rate_limits (id, key, count, reset_at, created_at)
    VALUES (gen_random_uuid(), ${key}, 1, ${new Date(now.getTime() + WINDOW_MS)}, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.reset_at <= ${now} THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= ${now} THEN ${new Date(now.getTime() + WINDOW_MS)}
        ELSE rate_limits.reset_at
      END
    RETURNING count, reset_at
  `;

  const row = rows[0];
  const count = Number(row.count);
  const resetAt = row.reset_at.getTime();

  if (count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: Math.max(0, MAX_REQUESTS - count), resetAt };
}
