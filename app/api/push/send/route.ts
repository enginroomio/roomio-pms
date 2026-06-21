import { NextResponse } from 'next/server';
import { sendHkPush } from '@/lib/push/send';
import { listPushSubscriptions, pushConfigured } from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, message: 'VAPID anahtarları tanımlı değil' }, { status: 503 });
  }

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    tag?: string;
    url?: string;
  };

  const subs = await listPushSubscriptions();
  if (subs.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Kayıtlı cihaz yok — HK Mobil sayfasında Bildirimleri aç',
        sent: 0,
        failed: 0,
        subscribers: 0,
      },
      { status: 404 },
    );
  }

  const result = await sendHkPush({
    title: body.title ?? 'Roomio HK',
    body: body.body ?? 'Yeni görev bildirimi',
    tag: body.tag,
    url: body.url,
  });

  return NextResponse.json({
    ok: result.sent > 0,
    ...result,
    subscribers: subs.length,
    message: result.sent > 0 ? undefined : result.errors[0] ?? 'Gönderim başarısız — Bildirimleri tekrar açın',
  });
}
