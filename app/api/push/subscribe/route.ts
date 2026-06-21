import { NextResponse } from 'next/server';
import { listPushSubscriptions, pushConfigured, savePushSubscription } from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await listPushSubscriptions();
  return NextResponse.json({ ok: true, count: items.length, configured: pushConfigured() });
}

export async function POST(req: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, message: 'VAPID anahtarları tanımlı değil' }, { status: 503 });
  }

  const body = (await req.json()) as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    role?: string;
    deviceLabel?: string;
  };

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ ok: false, message: 'Geçersiz abonelik' }, { status: 400 });
  }

  const saved = await savePushSubscription({
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    role: body.role,
    deviceLabel: body.deviceLabel,
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
