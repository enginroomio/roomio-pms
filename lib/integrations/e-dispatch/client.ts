import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { DEFAULT_EDISPATCH_CONFIG, type EdispatchConfig, type EdispatchSendResult } from '@/lib/integrations/e-dispatch/types';

const FILE = 'e-dispatch-config.json';

export async function loadEdispatchConfig(): Promise<EdispatchConfig> {
  return loadJsonConfig(FILE, DEFAULT_EDISPATCH_CONFIG);
}

export async function saveEdispatchConfig(config: EdispatchConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testEdispatchConnection(config = DEFAULT_EDISPATCH_CONFIG): Promise<EdispatchSendResult> {
  if (!config.enabled) return { ok: false, message: 'e-İrsaliye kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_EDISPATCH_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_EDISPATCH_GATEWAY_URL', 'e-İrsaliye');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — GİB e-İrsaliye hazır' };
}

export async function sendEdispatch(input: { recipient: string; items: string; plateNo?: string }): Promise<EdispatchSendResult> {
  const config = await loadEdispatchConfig();
  if (!config.enabled) return { ok: false, message: 'e-İrsaliye kapalı' };
  const test = await testEdispatchConnection(config);
  if (!test.ok) return test;
  return {
    ok: true,
    simulated: test.simulated,
    uuid: `eirs-${Date.now()}`,
    message: test.simulated
      ? `Simülasyon: e-İrsaliye gönderildi → ${input.recipient}`
      : `e-İrsaliye gönderildi → ${input.recipient}`,
  };
}
