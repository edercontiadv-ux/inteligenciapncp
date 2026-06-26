import { prisma } from '@/lib/prisma';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
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
