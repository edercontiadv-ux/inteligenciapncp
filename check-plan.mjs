import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg(process.env.DATABASE_URL ?? '');
const prisma = new PrismaClient({ adapter });
try {
  const users = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.name, u.email, s.status, s.trial_ends_at, p.name as plan_name, p.max_searches, (SELECT COUNT(*)::int FROM search_logs sl WHERE sl.user_id = u.id AND sl.created_at >= CURRENT_DATE) as searches_today FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('trial', 'active') LEFT JOIN plans p ON p.id = s.plan_id ORDER BY u.created_at DESC LIMIT 10;
  `);
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.error(e);
} finally {
  await prisma.$disconnect();
}
