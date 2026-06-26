import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
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
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { success: false, message: 'E-mail já verificado' },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'email_verification',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, message: 'Código inválido ou expirado. Solicite um novo.' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.verificationCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
    ]);

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
      message: 'E-mail confirmado!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    setAuthCookies(res, token, refreshToken);
    return res;
  } catch (error) {
    console.error('Error in verify-email:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
