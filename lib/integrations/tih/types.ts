/** TIH — Elektra v5 servis programı: otomatik EGM/KBS kimlik bildirimi */

import type { EgmIdentityRecord } from '@/lib/egm/types';

export type TihConfig = {
  enabled: boolean;
  /** Elektra v5 sunucu üzerinden gönder (önerilen) */
  useElektraServer: boolean;
  /** Check-in sonrası otomatik EGM gönder */
  autoSubmitOnCheckIn: boolean;
  /** Çıkış sonrası EGM bildirimi */
  autoSubmitOnCheckOut: boolean;
  facilityCode: string;
  simulateWhenOffline: boolean;
};

export type TihSubmitResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  egmRef?: string;
};

export type TihGuestPayload = Pick<
  EgmIdentityRecord,
  | 'firstName'
  | 'lastName'
  | 'roomNo'
  | 'nationality'
  | 'idNo'
  | 'idType'
  | 'birthDate'
  | 'birthPlace'
  | 'gender'
  | 'fatherName'
  | 'motherName'
  | 'checkIn'
  | 'checkOut'
>;

export const DEFAULT_TIH_CONFIG: TihConfig = {
  enabled: true,
  useElektraServer: true,
  autoSubmitOnCheckIn: true,
  autoSubmitOnCheckOut: true,
  facilityCode: '',
  simulateWhenOffline: true,
};
