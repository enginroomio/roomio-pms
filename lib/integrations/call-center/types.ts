export type CallCenterConfig = {
  enabled: boolean;
  queueName: string;
  maxWaitSeconds: number;
  recordCalls: boolean;
  linkToPbx: boolean;
  upsellScripts: string[];
  simulateWhenOffline: boolean;
};

export const DEFAULT_CALL_CENTER_CONFIG: CallCenterConfig = {
  enabled: true,
  queueName: 'Otel Rezervasyon',
  maxWaitSeconds: 120,
  recordCalls: true,
  linkToPbx: true,
  upsellScripts: [
    'Spa paketi öner',
    'Restoran rezervasyonu al',
    'Oda upgrade teklif et',
  ],
  simulateWhenOffline: true,
};
