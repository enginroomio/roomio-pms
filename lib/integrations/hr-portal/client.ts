import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { DEFAULT_HR_PORTAL_CONFIG, type HrPortalConfig } from '@/lib/integrations/hr-portal/types';

const FILE = 'hr-portal-config.json';

export async function loadHrPortalConfig(): Promise<HrPortalConfig> {
  return loadJsonConfig(FILE, DEFAULT_HR_PORTAL_CONFIG);
}

export async function saveHrPortalConfig(config: HrPortalConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testHrPortalConnection(config = DEFAULT_HR_PORTAL_CONFIG) {
  if (!config.enabled) return { ok: false, message: 'IK portalı kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_HR_PORTAL_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_HR_PORTAL_GATEWAY_URL', 'IK portalı');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — IK mobil portal hazır' };
}

export async function getPublicHrPortalInfo() {
  const config = await loadHrPortalConfig();
  return {
    ok: config.enabled,
    appName: config.appName,
    features: {
      leaveRequests: config.allowLeaveRequests,
      shiftSwap: config.allowShiftSwap,
      payrollView: config.allowPayrollView,
      training: config.allowTraining,
    },
  };
}
