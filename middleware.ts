import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthRequired, AUTH_COOKIE } from '@/lib/auth/config';
import { verifyToken } from '@/lib/auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/setup',
  '/offline',
  '/wifi',
  '/book',
  '/guest',
  '/menu',
  '/kiosk',
  '/spa',
  '/viofun',
  '/marina',
  '/app',
  '/ask',
  '/restaurant',
  '/carbon',
  '/staff',
  '/hr',
  '/fair',
  '/gym',
  '/hotel',
  '/manifest.json',
  '/sw.js',
  '/icons/',
];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/setup',
  '/api/auth/setup-status',
  '/api/auth/config',
  '/api/health',
  '/api/compliance/5651/wifi/',
  '/api/booking/availability',
  '/api/booking/reserve',
  '/api/guest-portal/session',
  '/api/guest-portal/check-in',
  '/api/integrations/digital-menu/menu',
  '/api/kiosk/info',
  '/api/kiosk/lookup',
  '/api/kiosk/check-in',
  '/api/spa/catalog',
  '/api/spa/bookings',
  '/api/integrations/viofun/catalog',
  '/api/integrations/viofun/bookings',
  '/api/integrations/marina/catalog',
  '/api/integrations/marina/bookings',
  '/api/integrations/guest-app/info',
  '/api/integrations/ai-assistant/chat',
  '/api/integrations/hr-portal/info',
  '/api/integrations/inventory/summary',
  '/api/integrations/restaurant-booking/catalog',
  '/api/integrations/restaurant-booking/book',
  '/api/integrations/lite-mobile/info',
  '/api/integrations/carbon/info',
  '/api/integrations/carbon/quote',
  '/api/integrations/fair-events/catalog',
  '/api/integrations/fair-events/register',
  '/api/integrations/gym/catalog',
  '/api/integrations/gym/book',
  '/api/integrations/website-builder/preview',
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
