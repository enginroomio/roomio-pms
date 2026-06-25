export type EfaturaEnvironment = 'test' | 'production';

export type EfaturaConfig = {
  enabled: boolean;
  environment: EfaturaEnvironment;
  integrator: string;
  username: string;
  password: string;
  vkn: string;
  alias: string;
  autoSendOnIssue: boolean;
  sendEArchive: boolean;
  sendEDispatch: boolean;
  simulateWhenOffline: boolean;
};

export const DEFAULT_EFATURA_CONFIG: EfaturaConfig = {
  enabled: false,
  environment: 'test',
  integrator: 'roomio-efatura-bridge',
  username: '',
  password: '',
  vkn: '',
  alias: 'urn:mail:default@efatura.gov.tr',
  autoSendOnIssue: true,
  sendEArchive: true,
  sendEDispatch: false,
  simulateWhenOffline: true,
};

export type EfaturaSubmission = {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  submittedAt: string;
  status: 'pending' | 'sent' | 'error';
  uuid?: string;
  message: string;
  simulated?: boolean;
};

export type EfaturaSendResult = {
  ok: boolean;
  message: string;
  submission?: EfaturaSubmission;
  simulated?: boolean;
};
