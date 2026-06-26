import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

const resendSchema = z.object({
  email: z.string().email('E-mail inválido'),
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
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

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

    const recent = await prisma.verificationCode.findFirst({
      where: { email, type: 'email_verification', createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
    });
    if (recent) {
      return NextResponse.json(
        { success: false, message: 'Aguarde 1 minuto antes de solicitar um novo código.' },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true, message: 'Código reenviado!' });
  } catch (error) {
    console.error('Error in resend-code:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
