import { prisma } from '@/lib/prisma';

export type PlanInfo = {
  slug: string;
  name: string;
  priceCents: number;
  maxUsers: number;
  maxClients: number;
  maxSearches: number;
  status: string;
  trialEndsAt: Date | null;
};

export async function getUserPlan(userId: string): Promise<PlanInfo | null> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['trial', 'active'] } },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!sub) return null;

  const expired = sub.status === 'trial' && sub.trialEndsAt && sub.trialEndsAt < new Date();
  if (expired) {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'expired' } });
    return null;
  }

  return {
    slug: sub.plan.slug,
    name: sub.plan.name,
    priceCents: sub.plan.priceCents,
    maxUsers: sub.plan.maxUsers,
    maxClients: sub.plan.maxClients,
    maxSearches: sub.plan.maxSearches,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
  };
}

export async function checkSearchLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: false, remaining: 0 };
  if (plan.maxSearches === -1) return { allowed: true, remaining: -1 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.searchLog.count({
    where: { userId, createdAt: { gte: today, lt: tomorrow } },
  });

  const remaining = Math.max(0, plan.maxSearches - count);
  return { allowed: remaining > 0, remaining };
}


