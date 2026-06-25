import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

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

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
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

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Invalid credentials' },
    { status: 401 }
  );
}
