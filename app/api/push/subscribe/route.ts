import { NextResponse } from 'next/server';
import {
  countPushSubscriptions,
  listPushSubscriptions,
  pushConfigured,
  savePushSubscription,
} from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listPushSubscriptions();
    return NextResponse.json({ ok: true, count: items.length, configured: pushConfigured() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Abonelik listesi alınamadı';
    return NextResponse.json({ ok: false, message, count: 0, configured: pushConfigured() }, { status: 500 });
  }
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

  try {
    const saved = await savePushSubscription({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      role: body.role,
      deviceLabel: body.deviceLabel,
    });
    const count = await countPushSubscriptions();
    return NextResponse.json({ ok: true, id: saved.id, count });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Abonelik veritabanına kaydedilemedi';
    console.error('[push/subscribe]', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
