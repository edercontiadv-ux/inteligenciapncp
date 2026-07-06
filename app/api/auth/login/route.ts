import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { checkLoginAttempts, recordLoginAttempt, logAuthEvent, extractRequestMetadata } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = extractRequestMetadata(req);

    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const { isLocked, lockUntil } = await checkLoginAttempts(email, ip);
    if (isLocked) {
      const minutes = lockUntil
        ? Math.ceil((lockUntil.getTime() - Date.now()) / 60000)
        : 30;

      logAuthEvent({
        action: 'LOGIN_FAILED',
        email,
        ipAddress: ip,
        userAgent,
        success: false,
        errorReason: 'ACCOUNT_LOCKED',
        metadata: { lockDurationMinutes: minutes },
      });

      return NextResponse.json(
        { success: false, message: `Muitas tentativas. Tente novamente em ${minutes} minuto(s).` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await recordLoginAttempt(email, ip, false);

      logAuthEvent({
        action: 'LOGIN_FAILED',
        email,
        ipAddress: ip,
        userAgent,
        success: false,
        errorReason: 'INVALID_CREDENTIALS',
      });

      return NextResponse.json(
        { success: false, message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, ip, false);

      logAuthEvent({
        action: 'LOGIN_FAILED',
        userId: user.id,
        email,
        ipAddress: ip,
        userAgent,
        success: false,
        errorReason: 'INVALID_CREDENTIALS',
      });

      return NextResponse.json(
        { success: false, message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    await recordLoginAttempt(email, ip, true);

    logAuthEvent({
      action: 'LOGIN',
      userId: user.id,
      email,
      ipAddress: ip,
      userAgent,
      success: true,
    });

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = await signRefreshToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    setAuthCookies(res, token, refreshToken);

    return res;
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
