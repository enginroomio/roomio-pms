import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { loadPbxConfig, testPbxConnection } from '@/lib/integrations/pbx/client';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { DEFAULT_CALL_CENTER_CONFIG, type CallCenterConfig } from '@/lib/integrations/call-center/types';

const FILE = 'call-center-config.json';

export async function loadCallCenterConfig(): Promise<CallCenterConfig> {
  return loadJsonConfig(FILE, DEFAULT_CALL_CENTER_CONFIG);
}

export async function saveCallCenterConfig(config: CallCenterConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testCallCenterStack(config = DEFAULT_CALL_CENTER_CONFIG): Promise<{
  ok: boolean;
  message: string;
  pbxLinked?: boolean;
  simulated?: boolean;
}> {
  if (!config.enabled) return { ok: false, message: 'Çağrı merkezi kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (config.linkToPbx) {
    const pbx = await loadPbxConfig();
    const test = await testPbxConnection(pbx);
    return {
      ok: test.ok,
      simulated: test.simulated ?? simulated,
      pbxLinked: true,
      message: test.ok ? `PBX bağlı — ${config.queueName}` : test.message,
    };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — çağrı kuyruğu hazır' };
}
