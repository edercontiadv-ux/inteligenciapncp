import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken, getRefreshTokenFromRequest, setAuthCookies } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { extractRequestMetadata } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { ip } = extractRequestMetadata(req);

    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const rawToken = getRefreshTokenFromRequest(req);
    if (!rawToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token não encontrado' },
        { status: 401 }
      );
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const blacklisted = await prisma.refreshTokenBlacklist.findUnique({ where: { tokenHash } });
    if (blacklisted) {
      return NextResponse.json(
        { success: false, message: 'Refresh token já foi invalidado' },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(rawToken);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return NextResponse.json(
        { success: false, message: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = await signRefreshToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion });

    await prisma.refreshTokenBlacklist.create({
      data: { tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const res = NextResponse.json({ success: true });
    setAuthCookies(res, token, refreshToken);
    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Refresh token inválido ou expirado' },
      { status: 401 }
    );
  }
}
