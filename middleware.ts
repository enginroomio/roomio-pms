import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthRequired, AUTH_COOKIE } from '@/lib/auth/config';
import { verifyToken } from '@/lib/auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/offline',
  '/wifi',
  '/manifest.json',
  '/sw.js',
  '/icons/',
];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/config',
  '/api/health',
  '/api/compliance/5651/wifi/',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith('/_next')) return true;
  if (/\.(?:svg|png|jpg|jpeg|ico|webp|css|js|woff2?)$/i.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || !isAuthRequired()) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(AUTH_COOKIE)?.value ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
