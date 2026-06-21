import { NextResponse } from 'next/server';
import {
  countPushSubscriptions,
  listPushSubscriberViews,
  pushConfigured,
  savePushSubscription,
} from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') ?? undefined;
    const detail = searchParams.get('detail') === '1';

    if (detail) {
      const subscribers = await listPushSubscriberViews(role);
      const online = subscribers.filter((s) => s.online).length;
      return NextResponse.json({
        ok: true,
        configured: pushConfigured(),
        count: subscribers.length,
        online,
        subscribers: subscribers.map((s) => ({
          id: s.id,
          deviceLabel: s.deviceLabel ?? 'HK Mobil',
          role: s.role,
          online: s.online,
          lastSeenAt: s.lastSeenAt ?? null,
        })),
      });
    }

    const count = await countPushSubscriptions(role);
    return NextResponse.json({ ok: true, count, configured: pushConfigured() });
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
    const count = await countPushSubscriptions('hk');
    const online = (await listPushSubscriberViews('hk')).filter((s) => s.online).length;
    return NextResponse.json({ ok: true, id: saved.id, count, online });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Abonelik veritabanına kaydedilemedi';
    console.error('[push/subscribe]', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
