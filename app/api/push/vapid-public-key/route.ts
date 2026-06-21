import { NextResponse } from 'next/server';
import { pushConfigured } from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? null;
  return NextResponse.json({
    ok: pushConfigured(),
    publicKey,
    subject: process.env.VAPID_SUBJECT ?? 'mailto:hk@roomio.local',
  });
}
