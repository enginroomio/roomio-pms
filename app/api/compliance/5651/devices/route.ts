import { NextResponse } from 'next/server';
import { getDeviceStatus, syncDeviceSessions, testNetworkDevices } from '@/lib/integrations/hotspot5651/devices';

export async function GET() {
  const status = await getDeviceStatus();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { action?: 'test' | 'sync'; device?: 'mikrotik' | 'unifi' };

  if (body.action === 'sync') {
    const result = await syncDeviceSessions();
    return NextResponse.json({ ok: true, ...result });
  }

  const results = await testNetworkDevices(body.device);
  const ok = results.every((r) => r.ok);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 502 });
}
