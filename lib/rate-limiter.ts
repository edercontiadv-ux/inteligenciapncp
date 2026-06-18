import { prisma } from './prisma';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const key = `rl:${ip}`;

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || now > existing.resetAt) {
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
        create: { key, count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now.getTime() + WINDOW_MS };
    }

    if (existing.count >= MAX_REQUESTS) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt.getTime() };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return { allowed: true, remaining: MAX_REQUESTS - existing.count - 1, resetAt: existing.resetAt.getTime() };
  } catch {
    return { allowed: true, remaining: MAX_REQUESTS, resetAt: now.getTime() + WINDOW_MS };
  }
}
