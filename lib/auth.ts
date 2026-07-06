import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export function validateJwtSecret(secret: string | undefined): asserts secret is string {
  if (!secret) {
    throw new Error(
      'JWT_SECRET não está definido. Configure a variável de ambiente JWT_SECRET ' +
      'com 64 caracteres hexadecimais (32 bytes).'
    );
  }

  if (secret.length < 64) {
    throw new Error(
      `JWT_SECRET muito curto (${secret.length} caracteres). ` +
      `O mínimo recomendado é 64 caracteres hexadecimais (32 bytes). ` +
      `Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }

  if (!/^[0-9a-fA-F]{64,}$/.test(secret)) {
    throw new Error(
      'JWT_SECRET deve ser uma string hexadecimal de 64 ou mais caracteres.'
    );
  }
}

export function parseAndValidateJwtExpiry(input: string | undefined): number {
  const value = input || '15m';
  const match = value.match(/^(\d+)(m|s)$/);

  if (!match) {
    throw new Error(
      `JWT_EXPIRES_IN inválido: "${value}". Use formato como "15m" (minutos) ou "900s" (segundos).`
    );
  }

  const num = parseInt(match[1], 10);
  const unit = match[2];
  const seconds = unit === 'm' ? num * 60 : num;

  if (seconds < 300) {
    throw new Error(
      `JWT_EXPIRES_IN muito curto: ${seconds}s. O mínimo permitido é 300s (5 minutos).`
    );
  }

  if (seconds > 3600) {
    throw new Error(
      `JWT_EXPIRES_IN muito longo: ${seconds}s. O máximo permitido é 3600s (60 minutos).`
    );
  }

  return seconds;
}

const rawJwtExpiry = process.env.JWT_EXPIRES_IN || '15m';
const rawRefreshExpiry = '7d';

const JWT_EXPIRES_SECONDS = parseAndValidateJwtExpiry(rawJwtExpiry);

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  validateJwtSecret(secret);
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SignTokenInput {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export async function signToken(payload: SignTokenInput): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${JWT_EXPIRES_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as JwtPayload;
}

export async function signRefreshToken(payload: SignTokenInput): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'refresh',
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(rawRefreshExpiry)
    .sign(getJwtSecret());
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload & { type?: string }> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  const data = payload as unknown as JwtPayload & { type?: string };
  if (data.type !== 'refresh') throw new Error('Token is not a refresh token');
  return data;
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
    maxAge: JWT_EXPIRES_SECONDS,
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
