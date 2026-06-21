import { NextResponse } from 'next/server';
import { handleGuestWifiLogin } from '@/lib/integrations/hotspot5651/wifi-login';
import type { GuestWifiLoginRequest } from '@/lib/integrations/hotspot5651/wifi-login';

export async function POST(req: Request) {
  const body = (await req.json()) as GuestWifiLoginRequest;
  if (!body.roomNo || !body.password) {
    return NextResponse.json({ ok: false, message: 'Oda no ve şifre gerekli' }, { status: 400 });
  }

  const result = await handleGuestWifiLogin(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
