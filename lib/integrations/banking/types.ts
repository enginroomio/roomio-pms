export type BankAccount = {
  id: string;
  bankName: string;
  iban: string;
  currency: string;
  balance: number;
};

export type BankingConfig = {
  enabled: boolean;
  autoReconcile: boolean;
  syncIntervalMinutes: number;
  accounts: BankAccount[];
  simulateWhenOffline: boolean;
};

export const DEFAULT_BANKING_CONFIG: BankingConfig = {
  enabled: false,
  autoReconcile: true,
  syncIntervalMinutes: 30,
  simulateWhenOffline: true,
  accounts: [
    { id: 'try-main', bankName: 'Ziraat Bankası', iban: 'TR00 0001 0000 0000 0000 0000 01', currency: 'TRY', balance: 0 },
    { id: 'eur-fx', bankName: 'İş Bankası', iban: 'TR00 0006 4000 0000 0000 0000 02', currency: 'EUR', balance: 0 },
  ],
};

export type BankingSyncResult = {
  ok: boolean;
  message: string;
  updatedAccounts: number;
  simulated?: boolean;
};
