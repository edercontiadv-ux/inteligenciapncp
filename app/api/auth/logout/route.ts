import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenFromRequest, clearAuthCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
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
    return res;
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
