import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import {
  LIVE_GATEWAY_ENV_KEYS,
  probeLiveGateway,
  type LiveProbeResult,
} from '@/lib/integrations/live-probe';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const live = isIntegrationLiveMode();
  const probes: Record<string, LiveProbeResult> = {};

  if (live) {
    probes.channel = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.channel, 'Kanal yöneticisi');
    probes.booking = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.booking, 'Online rezervasyon');
    probes.efatura = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.efatura, 'e-Fatura');
    probes.guestPortal = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.guestPortal, 'Misafir portalı');
    probes.whatsapp = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.whatsapp, 'WhatsApp API');
    probes.reputation = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.reputation, 'İtibar yönetimi');
    probes.banking = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.banking, 'Banka entegrasyonları');
    probes.tourOperator = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.tourOperator, 'Tur operatörü');
    probes.viofun = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.viofun, 'Viofun');
    probes.ai = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.ai, 'AI asistan');
    probes.marina = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.marina, 'Marina');
    probes.hrPortal = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.hrPortal, 'IK portalı');
    probes.virtualPos = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.virtualPos, 'Sanal POS');
    probes.googleBackup = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.googleBackup, 'Google BigQuery');
    probes.eDispatch = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.eDispatch, 'e-İrsaliye');
    probes.idReader = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.idReader, 'Kimlik okuyucu');
  }

  const configured = Object.values(LIVE_GATEWAY_ENV_KEYS).filter((k) => !!process.env[k]?.trim());
  const allOk = !live || Object.values(probes).every((p) => p.ok);

  return NextResponse.json({
    ok: allOk,
    live,
    configuredGateways: configured,
    probes,
    env: LIVE_GATEWAY_ENV_KEYS,
  });
}
