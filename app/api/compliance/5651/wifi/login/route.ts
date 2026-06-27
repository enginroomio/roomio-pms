import { NextResponse } from 'next/server';
import { handleGuestWifiLogin } from '@/lib/integrations/hotspot5651/wifi-login';
import type { GuestWifiLoginRequest } from '@/lib/integrations/hotspot5651/wifi-login';
import { checkRateLimit, clientIpFromRequest, rateLimitHeaders } from '@/lib/server/rate-limit';

// NOT: Misafir WiFi girişi tipik olarak otel içi tek bir NAT/router IP'si
// arkasından gelir — yani birçok farklı misafir aynı public IP'yi paylaşır.
// Bu yüzden limit anahtarı SADECE IP değil, "IP + oda no" kombinasyonudur:
// bu, bir odanın şifresine karşı kaba kuvvet denemesini engellerken aynı
// otelin diğer misafirlerini (farklı oda no'larıyla) etkilemez.
const WIFI_LOGIN_LIMIT = 10;
const WIFI_LOGIN_WINDOW_SEC = 15 * 60;

export async function POST(req: Request) {
  const body = (await req.json()) as GuestWifiLoginRequest;
  if (!body.roomNo || !body.password) {
    return NextResponse.json({ ok: false, message: 'Oda no ve şifre gerekli' }, { status: 400 });
  }

  const ip = clientIpFromRequest(req);
  const limitResult = await checkRateLimit(
    `wifi-login:${ip}:${body.roomNo}`,
    WIFI_LOGIN_LIMIT,
    WIFI_LOGIN_WINDOW_SEC,
  );
  if (!limitResult.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
      { status: 429, headers: rateLimitHeaders(limitResult) },
    );
  }

  const result = await handleGuestWifiLogin(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
