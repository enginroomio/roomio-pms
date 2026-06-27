import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { appendHotspotLog, closeHotspotSession, listHotspotLogs } from '@/lib/integrations/hotspot5651/server';
import type { HotspotSessionLog } from '@/lib/integrations/hotspot5651/types';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  const roomNo = url.searchParams.get('roomNo') ?? undefined;
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;
  const logs = await listHotspotLogs({ from, to, roomNo, limit });
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
    const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    action?: 'close';
    sessionId?: string;
    log?: Omit<HotspotSessionLog, 'id' | 'createdAt' | 'guestIdMasked' | 'btkCompliant'> & { guestIdRaw?: string };
  };

  if (body.action === 'close' && body.sessionId) {
    const closed = await closeHotspotSession(body.sessionId);
    if (!closed) return NextResponse.json({ ok: false, message: 'Oturum bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, log: closed });
  }

  if (!body.log) {
    return NextResponse.json({ ok: false, message: 'log gerekli' }, { status: 400 });
  }

  const created = await appendHotspotLog(body.log);
  return NextResponse.json({ ok: true, log: created });
}
