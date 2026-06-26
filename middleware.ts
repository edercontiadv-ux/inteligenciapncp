import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não está definido. Configure a variável de ambiente JWT_SECRET antes de iniciar a aplicação.');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

const protectedPages = ['/busca', '/tarefas', '/orgaos', '/planos', '/account'];

function getToken(req: NextRequest): string | null {
  const fromCookie = req.cookies.get('inteligencia-pncp-token')?.value;
  if (fromCookie) return fromCookie;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = getToken(req);

  if (pathname === '/') {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret());
        return NextResponse.redirect(new URL('/busca', req.url));
      } catch {}
    }
    return NextResponse.next();
  }

  const isProtected = protectedPages.some(route => pathname === route || pathname.startsWith(route + '/'));
  if (!isProtected) return NextResponse.next();

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getJwtSecret());
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/', '/busca', '/busca/:path*', '/tarefas', '/tarefas/:path*', '/orgaos', '/orgaos/:path*', '/planos', '/planos/:path*', '/account', '/account/:path*'],
};
