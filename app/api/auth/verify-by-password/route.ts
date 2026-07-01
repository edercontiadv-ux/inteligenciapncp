import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Senha inválida' }, { status: 401 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: false, message: 'E-mail já verificado. Faça login normalmente.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free-trial' } });
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    setAuthCookies(res, token, refreshToken);
    return res;
  } catch (error) {
    console.error('Error in verify-by-password:', error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
  }
}
