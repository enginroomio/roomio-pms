export type AiProvider = 'openai' | 'azure' | 'custom';

export type AiAssistantConfig = {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  apiKey: string;
  endpoint?: string;
  guestFacing: boolean;
  staffFacing: boolean;
  language: string;
  systemPrompt: string;
  simulateWhenOffline: boolean;
};

export const DEFAULT_AI_ASSISTANT_CONFIG: AiAssistantConfig = {
  enabled: true,
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: '',
  guestFacing: true,
  staffFacing: true,
  language: 'tr',
  systemPrompt: 'Sen bir otel asistanısın. Misafirlere check-in, SPA, restoran ve otel hizmetleri hakkında kısa ve nazik yanıtlar ver.',
  simulateWhenOffline: true,
};

export type AiChatResult = {
  ok: boolean;
  reply: string;
  simulated?: boolean;
  message?: string;
};
