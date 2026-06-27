import { NextResponse } from 'next/server';
import { registerFairAttendee } from '@/lib/integrations/fair-events/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    eventId?: string;
    name?: string;
    company?: string;
    email?: string;
  };

  if (!body.eventId?.trim() || !body.name?.trim() || !body.company?.trim() || !body.email?.trim()) {
    return NextResponse.json({ ok: false, message: 'eventId, name, company, email gerekli' }, { status: 400 });
  }

  try {
    return NextResponse.json(await registerFairAttendee({
      eventId: body.eventId,
      name: body.name,
      company: body.company,
      email: body.email,
    }));
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Kayıt başarısız' },
      { status: 500 },
    );
  }
}
