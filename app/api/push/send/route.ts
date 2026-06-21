import { NextResponse } from 'next/server';
import { sendHkPush } from '@/lib/push/send';
import { pushConfigured } from '@/lib/server/push-store';

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

  const result = await sendHkPush({
    title: body.title ?? 'Roomio HK',
    body: body.body ?? 'Yeni görev bildirimi',
    tag: body.tag,
    url: body.url,
  });

  return NextResponse.json({ ok: true, ...result });
}
