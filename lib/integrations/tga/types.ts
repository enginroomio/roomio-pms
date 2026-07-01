/** TGA — Turizm Geliştirme Ajansı segment & kanal istatistik raporu */

export type TgaConfig = {
  enabled: boolean;
  /** Elektra v5 sunucu üzerinden gönder (önerilen) */
  useElektraServer: boolean;
  /** Gün sonu / gece denetiminde otomatik gönder */
  autoSubmitDaily: boolean;
  /** Ay sonu otomatik gönder */
  autoSubmitMonthly: boolean;
  facilityCode: string;
  simulateWhenOffline: boolean;
};

export type TgaSubmitRequest = {
  businessDate: string;
  reportId?: string;
};

export type TgaSubmitResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  ref?: string;
};

export const DEFAULT_TGA_CONFIG: TgaConfig = {
  enabled: true,
  useElektraServer: true,
  autoSubmitDaily: true,
  autoSubmitMonthly: true,
  facilityCode: '',
  simulateWhenOffline: true,
};
