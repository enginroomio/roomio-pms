import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  callElektraService,
  isElektraRelayEnabled,
  loadElektraServerConfig,
} from '@/lib/integrations/elektra-server/client';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import { getAllReservationsServer } from '@/lib/server/pms-store';
import {
  DEFAULT_TIS_CONFIG,
  type TisConfig,
  type TisSubmitRequest,
  type TisSubmitResult,
} from '@/lib/integrations/tis/types';

const CONFIG_FILE = 'tis-config.json';

export async function loadTisConfig(): Promise<TisConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_TIS_CONFIG);
}

export async function saveTisConfig(config: TisConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

function buildTisPayload(businessDate: string, reportId?: string) {
  return {
    businessDate,
    reportId: reportId ?? 'tis-monthly',
    generatedAt: new Date().toISOString(),
  };
}

export async function submitTisReport(
  req: TisSubmitRequest,
  config?: TisConfig,
): Promise<TisSubmitResult> {
  const cfg = config ?? (await loadTisConfig());
  if (!cfg.enabled) {
    return { ok: false, message: 'TIS entegrasyonu kapalı' };
  }

  const elektra = await loadElektraServerConfig();
  const payload = buildTisPayload(req.businessDate, req.reportId);

  if (cfg.useElektraServer && isElektraRelayEnabled(elektra, 'tis')) {
    const reservations = await getAllReservationsServer();
    const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN').length;
    const result = await callElektraService('tis', 'submit', {
      ...payload,
      facilityCode: cfg.facilityCode || elektra.hotelCode,
      inHouse,
    }, elektra);
    return {
      ok: result.ok,
      simulated: result.simulated,
      message: result.ok ? `TIS raporu Elektra sunucuya iletildi (${req.businessDate})` : result.message,
      ref: result.ok ? `TIS-${req.businessDate}` : undefined,
    };
  }

  if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
    return {
      ok: true,
      simulated: true,
      message: `[Simülasyon] TIS raporu — ${req.businessDate}`,
      ref: `TIS-SIM-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  return { ok: false, message: 'TIS: Elektra sunucu köprüsü veya doğrudan gateway tanımlı değil' };
}

export async function testTisConnection(config = DEFAULT_TIS_CONFIG): Promise<TisSubmitResult> {
  const today = new Date().toISOString().slice(0, 10);
  return submitTisReport({ businessDate: today, reportId: 'tis-test' }, config);
}
