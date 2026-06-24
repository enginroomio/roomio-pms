import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  answerGuestReviewServer,
  deleteGuestReviewServer,
  getGuestReviewsServer,
  saveGuestReviewServer,
} from '@/lib/server/guest-reviews';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') ?? undefined;
  const rating = searchParams.get('rating');
  const status = searchParams.get('status') as 'answered' | 'pending' | null;
  const query = searchParams.get('q') ?? undefined;

  try {
    const reviews = await getGuestReviewsServer(propertyId, {
      source,
      rating: rating ? Number(rating) : undefined,
      status: status ?? undefined,
      query,
    });
    return NextResponse.json({ ok: true, reviews });
  } catch {
    return NextResponse.json({ error: 'reviews fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: string;
    id?: string;
    response?: string;
    guestName?: string;
    roomNo?: string;
    rating?: number;
    comment?: string;
    title?: string;
    source?: string;
    category?: string;
    lang?: 'TR' | 'EN';
  };

  try {
    if (body.action === 'answer' && body.id && body.response) {
      const review = await answerGuestReviewServer(body.id, body.response, propertyId);
      if (!review) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, review });
    }

    if (!body.guestName || !body.roomNo || !body.comment || body.rating == null) {
      return NextResponse.json({ error: 'guestName, roomNo, rating, comment gerekli' }, { status: 400 });
    }

    const review = await saveGuestReviewServer({
      guestName: body.guestName,
      roomNo: body.roomNo,
      rating: body.rating,
      comment: body.comment,
      title: body.title,
      source: body.source,
      category: body.category,
      lang: body.lang,
    }, propertyId);
    return NextResponse.json({ ok: true, review });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const ok = await deleteGuestReviewServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
