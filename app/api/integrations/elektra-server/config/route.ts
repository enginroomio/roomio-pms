import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadElektraServerConfig,
  saveElektraServerConfig,
} from '@/lib/integrations/elektra-server/client';
import type { ElektraServerConfig } from '@/lib/integrations/elektra-server/types';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const config = await loadElektraServerConfig();
  return NextResponse.json({
    ...config,
    password: config.password ? '••••••••' : '',
  });
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as Partial<ElektraServerConfig>;
  const current = await loadElektraServerConfig();
  const next: ElektraServerConfig = {
    ...current,
    ...body,
    relayServices: {
      ...current.relayServices,
      ...body.relayServices,
    },
    password: body.password && body.password !== '••••••••'
      ? body.password
      : current.password,
  };
  await saveElektraServerConfig(next);
  return NextResponse.json({ ok: true });
}
