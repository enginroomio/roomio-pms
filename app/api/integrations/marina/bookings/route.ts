import { NextResponse } from 'next/server';
import { bookMarinaBerth } from '@/lib/integrations/marina/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    berthId?: string;
    vesselName?: string;
    captain?: string;
    lengthM?: number;
    arrival?: string;
    departure?: string;
  };

  if (!body.berthId || !body.vesselName || !body.captain || !body.lengthM || !body.arrival || !body.departure) {
    return NextResponse.json({ ok: false, message: 'berthId, vesselName, captain, lengthM, arrival, departure gerekli' }, { status: 400 });
  }

  return NextResponse.json(await bookMarinaBerth({
    berthId: body.berthId,
    vesselName: body.vesselName,
    captain: body.captain,
    lengthM: Number(body.lengthM),
    arrival: body.arrival,
    departure: body.departure,
  }));
}
