export type VirtualPosConfig = {
  enabled: boolean;
  provider: string;
  merchantId: string;
  apiKey: string;
  secretKey: string;
  threeDSecure: boolean;
  installmentEnabled: boolean;
  currencies: string[];
  simulateWhenOffline: boolean;
};

export const DEFAULT_VIRTUAL_POS_CONFIG: VirtualPosConfig = {
  enabled: false,
  provider: 'iyzico',
  merchantId: '',
  apiKey: '',
  secretKey: '',
  threeDSecure: true,
  installmentEnabled: true,
  currencies: ['TRY', 'EUR', 'USD'],
  simulateWhenOffline: true,
};

export type VirtualPosChargeResult = {
  ok: boolean;
  message: string;
  transactionId?: string;
  simulated?: boolean;
};
