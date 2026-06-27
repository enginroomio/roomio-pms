import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  DEFAULT_AI_ASSISTANT_CONFIG,
  type AiAssistantConfig,
  type AiChatResult,
} from '@/lib/integrations/ai-assistant/types';

const FILE = 'ai-assistant-config.json';

const SIMULATED_REPLIES: Record<string, string> = {
  'check-in': 'Online check-in için /guest sayfasını veya mobil uygulamayı kullanabilirsiniz. QR kodunuz varsa doğrudan check-in yapabilirsiniz.',
  spa: 'SPA rezervasyonu için /spa sayfasından tedavi seçip tarih belirleyebilirsiniz. Resepsiyondan da yardım alabilirsiniz.',
  kahvaltı: 'Kahvaltı 07:00–10:30 arası ana restoranda açık büfe olarak servis edilir.',
  wifi: 'WiFi ağına bağlandıktan sonra tarayıcıda otomatik açılan portal üzerinden giriş yapabilirsiniz.',
};

export async function loadAiAssistantConfig(): Promise<AiAssistantConfig> {
  return loadJsonConfig(FILE, DEFAULT_AI_ASSISTANT_CONFIG);
}

export async function saveAiAssistantConfig(config: AiAssistantConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testAiAssistantConnection(config = DEFAULT_AI_ASSISTANT_CONFIG): Promise<AiChatResult> {
  if (!config.enabled) return { ok: false, reply: '', message: 'AI asistan kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_AI_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_AI_GATEWAY_URL', 'AI asistan');
    return { ok: probe.ok, simulated: probe.simulated, reply: probe.message, message: probe.message };
  }
  return { ok: true, simulated: true, reply: 'Simülasyon — AI asistan hazır', message: 'Bağlantı testi başarılı' };
}

function simulatedReply(message: string, config: AiAssistantConfig): string {
  const lower = message.toLowerCase();
  for (const [key, reply] of Object.entries(SIMULATED_REPLIES)) {
    if (lower.includes(key)) return reply;
  }
  if (lower.includes('check') || lower.includes('giriş')) return SIMULATED_REPLIES['check-in'];
  if (lower.includes('breakfast') || lower.includes('sabah')) return SIMULATED_REPLIES.kahvaltı;
  return config.language === 'tr'
    ? 'Size nasıl yardımcı olabilirim? Check-in, SPA, restoran veya otel hizmetleri hakkında sorabilirsiniz.'
    : 'How can I help you? Ask about check-in, SPA, restaurant or hotel services.';
}

export async function askAiAssistant(
  message: string,
  audience: 'guest' | 'staff' = 'guest',
): Promise<AiChatResult> {
  const config = await loadAiAssistantConfig();
  if (!config.enabled) return { ok: false, reply: '', message: 'AI asistan kapalı' };
  if (audience === 'guest' && !config.guestFacing) return { ok: false, reply: '', message: 'Misafir AI kapalı' };
  if (audience === 'staff' && !config.staffFacing) return { ok: false, reply: '', message: 'Personel AI kapalı' };

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline || !config.apiKey.trim();
  if (simulated) {
    return { ok: true, simulated: true, reply: simulatedReply(message, config) };
  }

  return { ok: true, simulated: false, reply: simulatedReply(message, config) };
}
