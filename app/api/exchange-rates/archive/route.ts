import { NextResponse } from 'next/server';
import { archiveStats, listArchiveDates, readArchiveEntry } from '@/lib/server/tcmb-archive';
import { backfillTcmbArchive, syncTcmbDaily } from '@/lib/server/tcmb-daily-sync';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');

  if (date) {
    const entry = readArchiveEntry(date);
    if (!entry) {
      return NextResponse.json({ ok: false, error: 'Arşiv kaydı bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, entry });
  }

  return NextResponse.json({
    ok: true,
    stats: archiveStats(),
    dates: listArchiveDates(365),
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';
  const backfill = Number(url.searchParams.get('backfill') ?? '0');

  if (backfill > 0) {
    const result = await backfillTcmbArchive(Math.min(backfill, 365));
    return NextResponse.json(result);
  }

  const result = await syncTcmbDaily({ force, backfillDays: 7 });
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
