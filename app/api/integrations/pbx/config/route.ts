import { NextResponse } from 'next/server';
import { loadPbxConfig, savePbxConfig } from '@/lib/integrations/pbx/client';
import type { PbxConfig } from '@/lib/integrations/pbx/types';

export async function GET() {
  const config = await loadPbxConfig();
  return NextResponse.json({
    ...config,
    apiPassword: config.apiPassword ? '••••••••' : '',
    pmsPassword: config.pmsPassword ? '••••••••' : '',
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<PbxConfig>;
  const current = await loadPbxConfig();
  const next: PbxConfig = {
    ...current,
    ...body,
    apiPassword: body.apiPassword && body.apiPassword !== '••••••••'
      ? body.apiPassword
      : current.apiPassword,
    pmsPassword: body.pmsPassword && body.pmsPassword !== '••••••••'
      ? body.pmsPassword
      : current.pmsPassword,
  };
  await savePbxConfig(next);
  return NextResponse.json({ ok: true });
}
