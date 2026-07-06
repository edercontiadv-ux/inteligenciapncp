import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenFromRequest, clearAuthCookies, authenticate } from '@/lib/auth';
import { logAuthEvent, extractRequestMetadata } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = extractRequestMetadata(req);
    const payload = await authenticate(req);

    const refreshToken = getRefreshTokenFromRequest(req);

    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshTokenBlacklist.upsert({
        where: { tokenHash },
        update: { expiresAt },
        create: { tokenHash, expiresAt },
      });
    }

    const res = NextResponse.json({ success: true, message: 'Sessão encerrada.' });
    clearAuthCookies(res);

    if (payload) {
      logAuthEvent({
        action: 'LOGOUT',
        userId: payload.sub,
        email: payload.email,
        ipAddress: ip,
        userAgent,
        success: true,
      });
    }

    return res;
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
