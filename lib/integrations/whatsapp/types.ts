export type WhatsappConfig = {
  enabled: boolean;
  cloudApiToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  welcomeTemplate: string;
  checkInTemplate: string;
  simulateWhenOffline: boolean;
};

export const DEFAULT_WHATSAPP_CONFIG: WhatsappConfig = {
  enabled: false,
  cloudApiToken: '',
  phoneNumberId: '',
  businessAccountId: '',
  welcomeTemplate: 'reservation_confirm',
  checkInTemplate: 'online_checkin',
  simulateWhenOffline: true,
};

export type WhatsappSendResult = {
  ok: boolean;
  message: string;
  messageId?: string;
  simulated?: boolean;
};
