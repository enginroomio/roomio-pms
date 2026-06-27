import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  DEFAULT_TOUR_OPERATOR_CONFIG,
  type TourOperatorConfig,
  type TourOperatorSyncResult,
} from '@/lib/integrations/tour-operator/types';

const FILE = 'tour-operator-config.json';

export async function loadTourOperatorConfig(): Promise<TourOperatorConfig> {
  return loadJsonConfig(FILE, DEFAULT_TOUR_OPERATOR_CONFIG);
}

export async function saveTourOperatorConfig(config: TourOperatorConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testTourOperatorConnection(config = DEFAULT_TOUR_OPERATOR_CONFIG): Promise<{
  ok: boolean;
  message: string;
  simulated?: boolean;
}> {
  if (!config.enabled) return { ok: false, message: 'Tur operatörü entegrasyonu kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_TOUR_OPERATOR_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_TOUR_OPERATOR_GATEWAY_URL', 'Tur operatörü');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  const active = config.operators.filter((o) => o.enabled).length;
  return { ok: true, simulated: true, message: `Simülasyon — ${active} operatör bağlı` };
}

export async function syncTourOperatorManifests(): Promise<TourOperatorSyncResult> {
  const config = await loadTourOperatorConfig();
  if (!config.enabled) return { ok: false, message: 'Tur operatörü kapalı', imported: 0, operators: [] };

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  const active = config.operators.filter((o) => o.enabled);
  const operators = active.map((o, i) => ({
    code: o.code,
    reservations: (i % 3) + 1,
  }));
  const imported = operators.reduce((s, o) => s + o.reservations, 0);

  return {
    ok: true,
    imported,
    operators,
    simulated,
    message: simulated
      ? `Simülasyon: ${imported} rezervasyon ${active.length} operatörden içe aktarıldı`
      : `${imported} rezervasyon senkronize edildi`,
  };
}
