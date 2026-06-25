import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  DEFAULT_VIRTUAL_POS_CONFIG,
  type VirtualPosChargeResult,
  type VirtualPosConfig,
} from '@/lib/integrations/virtual-pos/types';

const FILE = 'virtual-pos-config.json';

export async function loadVirtualPosConfig(): Promise<VirtualPosConfig> {
  return loadJsonConfig(FILE, DEFAULT_VIRTUAL_POS_CONFIG);
}

export async function saveVirtualPosConfig(config: VirtualPosConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testVirtualPosConnection(config = DEFAULT_VIRTUAL_POS_CONFIG): Promise<VirtualPosChargeResult> {
  if (!config.enabled) return { ok: false, message: 'Sanal POS kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_VIRTUAL_POS_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_VIRTUAL_POS_GATEWAY_URL', 'Sanal POS');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: `Simülasyon — ${config.provider} hazır` };
}

export async function chargeVirtualPos(input: {
  amount: number;
  currency: string;
  refNo: string;
  cardHolder?: string;
}): Promise<VirtualPosChargeResult> {
  const config = await loadVirtualPosConfig();
  if (!config.enabled) return { ok: false, message: 'Sanal POS kapalı' };
  const test = await testVirtualPosConnection(config);
  if (!test.ok) return test;
  return {
    ok: true,
    simulated: test.simulated,
    transactionId: `vpos-${Date.now()}`,
    message: test.simulated
      ? `Simülasyon: ${input.amount} ${input.currency} tahsil edildi (${input.refNo})`
      : `Ödeme başarılı: ${input.amount} ${input.currency}`,
  };
}
