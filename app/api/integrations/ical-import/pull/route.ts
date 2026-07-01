import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { fetchAndParseFeed, loadIcalFeeds, markFeedPulled } from '@/lib/integrations/ical-import/client';

export const dynamic = 'force-dynamic';

const CHANNEL_LABEL: Record<string, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia.com',
  other: 'Diğer',
};

/** Kaydedilmiş bir iCal linkini çeker, ayrıştırır ve hazır DraftRow şeklinde döner — yazma işlemi yapmaz. */
export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const { feedId } = (await req.json()) as { feedId?: string };
  if (!feedId) {
    return NextResponse.json({ ok: false, message: 'feedId gerekli' }, { status: 400 });
  }

  const { feeds } = await loadIcalFeeds();
  const feed = feeds.find((f) => f.id === feedId);
  if (!feed) {
    return NextResponse.json({ ok: false, message: 'Takvim linki bulunamadı' }, { status: 404 });
  }

  const result = await fetchAndParseFeed(feed);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 502 });
  }

  let skippedBlocks = 0;
  const rows = result.rows
    .filter((r) => {
      if (r.isBlock) {
        skippedBlocks += 1;
        return false;
      }
      return true;
    })
    .map((r) => ({
      key: `ical-${feed.id}-${r.uid}`,
      guestName: r.guestNameRaw || 'Misafir (iCal)',
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      roomType: r.roomType,
      mealPlan: 'BB',
      adults: 2,
      children: 0,
      rate: 0,
      currency: 'TRY',
      agency: CHANNEL_LABEL[r.channel] ?? 'Diğer',
      market: 'BAR',
      transferIn: '',
      transferOut: '',
      flightNo: '',
    }));

  await markFeedPulled(feed.id);

  return NextResponse.json({ ok: true, rows, skippedBlocks });
}
