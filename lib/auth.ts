import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = '7d';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não está definido. Configure a variável de ambiente JWT_SECRET antes de iniciar a aplicação.');
  }
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ sub: payload.userId, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as JwtPayload;
}

export async function signRefreshToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ sub: payload.userId, email: payload.email, role: payload.role, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_EXPIRES_IN)
    .sign(getJwtSecret());
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if ((payload as any).type !== 'refresh') throw new Error('Token is not a refresh token');
  return payload as unknown as JwtPayload;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const fromCookie = req.cookies.get('inteligencia-pncp-token')?.value;
  if (fromCookie) return fromCookie;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function getRefreshTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get('inteligencia-pncp-refresh')?.value || null;
}

export async function authenticate(req: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string): void {
  const isSecure = process.env.NODE_ENV === 'production';

  res.cookies.set('inteligencia-pncp-token', accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });

  res.cookies.set('inteligencia-pncp-refresh', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set('inteligencia-pncp-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  res.cookies.set('inteligencia-pncp-refresh', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 0,
  });
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Invalid credentials' },
    { status: 401 }
  );
}
