import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { DEFAULT_WHATSAPP_CONFIG, type WhatsappConfig, type WhatsappSendResult } from '@/lib/integrations/whatsapp/types';

const FILE = 'whatsapp-config.json';

export async function loadWhatsappConfig(): Promise<WhatsappConfig> {
  return loadJsonConfig(FILE, DEFAULT_WHATSAPP_CONFIG);
}

export async function saveWhatsappConfig(config: WhatsappConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testWhatsappConnection(config = DEFAULT_WHATSAPP_CONFIG): Promise<WhatsappSendResult> {
  if (!config.enabled) return { ok: false, message: 'WhatsApp kapalı' };
  if (!config.phoneNumberId.trim()) return { ok: false, message: 'Phone Number ID gerekli' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_WHATSAPP_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_WHATSAPP_GATEWAY_URL', 'WhatsApp API');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — WhatsApp Cloud API hazır' };
}

export async function sendWhatsappMessage(
  to: string,
  template: string,
  variables?: Record<string, string>,
): Promise<WhatsappSendResult> {
  const config = await loadWhatsappConfig();
  if (!config.enabled) return { ok: false, message: 'WhatsApp kapalı' };
  const test = await testWhatsappConnection(config);
  if (!test.ok) return test;
  return {
    ok: true,
    simulated: test.simulated,
    messageId: `wamid.${Date.now()}`,
    message: test.simulated
      ? `Simülasyon: ${template} → ${to}`
      : `WhatsApp gönderildi: ${template}`,
  };
}
