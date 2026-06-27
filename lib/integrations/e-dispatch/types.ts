export type EdispatchConfig = {
  enabled: boolean;
  environment: 'test' | 'production';
  integrator: string;
  username: string;
  password: string;
  vkn: string;
  autoSendOnShipment: boolean;
  simulateWhenOffline: boolean;
};

export const DEFAULT_EDISPATCH_CONFIG: EdispatchConfig = {
  enabled: false,
  environment: 'test',
  integrator: '',
  username: '',
  password: '',
  vkn: '',
  autoSendOnShipment: true,
  simulateWhenOffline: true,
};

export type EdispatchSendResult = {
  ok: boolean;
  message: string;
  uuid?: string;
  simulated?: boolean;
};
