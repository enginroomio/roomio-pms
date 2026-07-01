/** TIS — Turizm İstatistik bildirimi (T.C. Kültür ve Turizm Bakanlığı, aylık) */

export type TisConfig = {
  enabled: boolean;
  /** Elektra v5 sunucu üzerinden gönder (önerilen) */
  useElektraServer: boolean;
  /** Gün sonu / gece denetiminde otomatik gönder (genelde kapalı — TIS aylık bir rapordur) */
  autoSubmitDaily: boolean;
  /** Ay sonu otomatik gönder */
  autoSubmitMonthly: boolean;
  facilityCode: string;
  simulateWhenOffline: boolean;
};

export type TisSubmitRequest = {
  businessDate: string;
  reportId?: string;
};

export type TisSubmitResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  ref?: string;
};

export const DEFAULT_TIS_CONFIG: TisConfig = {
  enabled: true,
  useElektraServer: true,
  autoSubmitDaily: false,
  autoSubmitMonthly: true,
  facilityCode: '',
  simulateWhenOffline: true,
};
