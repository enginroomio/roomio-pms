import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  callElektraService,
  isElektraRelayEnabled,
  loadElektraServerConfig,
} from '@/lib/integrations/elektra-server/client';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import { getAllReservationsServer } from '@/lib/server/pms-store';
import {
  DEFAULT_TGA_CONFIG,
  type TgaConfig,
  type TgaSubmitRequest,
  type TgaSubmitResult,
} from '@/lib/integrations/tga/types';

const CONFIG_FILE = 'tga-config.json';

export async function loadTgaConfig(): Promise<TgaConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_TGA_CONFIG);
}

export async function saveTgaConfig(config: TgaConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

function buildTgaPayload(businessDate: string, reportId?: string) {
  return {
    businessDate,
    reportId: reportId ?? 'tga-daily',
    generatedAt: new Date().toISOString(),
  };
}

export async function submitTgaReport(
  req: TgaSubmitRequest,
  config?: TgaConfig,
): Promise<TgaSubmitResult> {
  const cfg = config ?? (await loadTgaConfig());
  if (!cfg.enabled) {
    return { ok: false, message: 'TGA entegrasyonu kapalı' };
  }

  const elektra = await loadElektraServerConfig();
  const payload = buildTgaPayload(req.businessDate, req.reportId);

  if (cfg.useElektraServer && isElektraRelayEnabled(elektra, 'tga')) {
    const reservations = await getAllReservationsServer();
    const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN').length;
    const result = await callElektraService('tga', 'submit', {
      ...payload,
      facilityCode: cfg.facilityCode || elektra.hotelCode,
      inHouse,
    }, elektra);
    return {
      ok: result.ok,
      simulated: result.simulated,
      message: result.ok ? `TGA raporu Elektra sunucuya iletildi (${req.businessDate})` : result.message,
      ref: result.ok ? `TGA-${req.businessDate}` : undefined,
    };
  }

  if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
    return {
      ok: true,
      simulated: true,
      message: `[Simülasyon] TGA raporu — ${req.businessDate}`,
      ref: `TGA-SIM-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  return { ok: false, message: 'TGA: Elektra sunucu köprüsü veya doğrudan gateway tanımlı değil' };
}

export async function testTgaConnection(config = DEFAULT_TGA_CONFIG): Promise<TgaSubmitResult> {
  const today = new Date().toISOString().slice(0, 10);
  return submitTgaReport({ businessDate: today, reportId: 'tga-test' }, config);
}
