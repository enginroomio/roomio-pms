import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadAiAssistantConfig,
  saveAiAssistantConfig,
  testAiAssistantConnection,
} from '@/lib/integrations/ai-assistant/client';
import type { AiAssistantConfig } from '@/lib/integrations/ai-assistant/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadAiAssistantConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadAiAssistantConfig();
    return NextResponse.json(await testAiAssistantConnection(config));
  }

  await saveAiAssistantConfig((await req.json()) as AiAssistantConfig);
  return NextResponse.json({ ok: true });
}
