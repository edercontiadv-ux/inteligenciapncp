import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized } from '@/lib/auth';
import { getUserPlan } from '@/lib/plan';

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  const plan = await getUserPlan(payload.sub);
  if (!plan) {
    return NextResponse.json({ slug: 'none', name: 'Sem plano', priceCents: 0, maxUsers: 0, maxClients: 0, maxSearches: 0, status: 'none', trialEndsAt: null });
  }

  return NextResponse.json(plan);
}
