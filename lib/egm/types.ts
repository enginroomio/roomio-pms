/** EGM / KBS kimlik bildirim durumları */

export type EgmIdType = 'TCKN' | 'PASSPORT' | 'OTHER';
export type EgmGender = 'E' | 'K';
export type EgmNotifyStatus = 'missing' | 'draft' | 'ready' | 'sent' | 'error';

export type EgmIdentityRecord = {
  id: string;
  reservationId?: string;
  refNo?: string;
  guestName: string;
  firstName?: string;
  lastName?: string;
  roomNo: string;
  nationality: string;
  idNo: string;
  idType?: EgmIdType;
  birthDate?: string;
  birthPlace?: string;
  gender?: EgmGender;
  fatherName?: string;
  motherName?: string;
  checkIn: string;
  checkOut?: string;
  status: EgmNotifyStatus;
  sentAt?: string;
  egmRef?: string;
  errorMessage?: string;
  /** EGM/KBS çıkış (departure) bildirimi — check-out sonrası otomatik gönderim */
  checkOutStatus?: 'sent' | 'error';
  checkOutSentAt?: string;
  checkOutEgmRef?: string;
  checkOutErrorMessage?: string;
  createdAt: string;
};

export type EgmIdentityForm = {
  reservationId?: string;
  refNo?: string;
  firstName: string;
  lastName: string;
  roomNo: string;
  nationality: string;
  idNo: string;
  idType: EgmIdType;
  birthDate: string;
  birthPlace: string;
  gender: EgmGender | '';
  fatherName: string;
  motherName: string;
  checkIn: string;
  checkOut?: string;
};

export const EGM_STATUS_LABELS: Record<EgmNotifyStatus, string> = {
  missing: 'Eksik bilgi',
  draft: 'Taslak',
  ready: 'Gönderime hazır',
  sent: 'EGM gönderildi',
  error: 'Hata',
};

export const EGM_ID_TYPE_LABELS: Record<EgmIdType, string> = {
  TCKN: 'T.C. Kimlik',
  PASSPORT: 'Pasaport',
  OTHER: 'Diğer belge',
};

export const EGM_GENDER_LABELS: Record<EgmGender, string> = {
  E: 'Erkek',
  K: 'Kadın',
};

export function splitGuestName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] ?? '' };
}

export function egmRequiredFields(form: Partial<EgmIdentityForm>): string[] {
  const missing: string[] = [];
  if (!form.firstName?.trim()) missing.push('Ad');
  if (!form.lastName?.trim()) missing.push('Soyad');
  if (!form.nationality?.trim()) missing.push('Uyruk');
  if (!form.idNo?.trim()) missing.push('Kimlik / pasaport no');
  if (!form.birthDate) missing.push('Doğum tarihi');
  if (!form.birthPlace?.trim()) missing.push('Doğum yeri');
  if (!form.gender) missing.push('Cinsiyet');
  if (!form.fatherName?.trim()) missing.push('Baba adı');
  if (!form.motherName?.trim()) missing.push('Anne adı');
  if (!form.roomNo?.trim()) missing.push('Oda no');
  if (!form.checkIn) missing.push('Giriş tarihi');
  return missing;
}

export function computeEgmStatus(form: Partial<EgmIdentityForm>, current?: EgmNotifyStatus): EgmNotifyStatus {
  if (current === 'sent') return 'sent';
  if (current === 'error') return 'error';
  const missing = egmRequiredFields(form);
  if (missing.length === egmRequiredFields({}).length) return 'missing';
  if (missing.length > 0) return 'draft';
  return 'ready';
}

export function emptyEgmForm(seed?: Partial<EgmIdentityForm>): EgmIdentityForm {
  return {
    reservationId: seed?.reservationId,
    refNo: seed?.refNo,
    firstName: seed?.firstName ?? '',
    lastName: seed?.lastName ?? '',
    roomNo: seed?.roomNo ?? '',
    nationality: seed?.nationality ?? 'TR',
    idNo: seed?.idNo ?? '',
    idType: seed?.idType ?? 'TCKN',
    birthDate: seed?.birthDate ?? '',
    birthPlace: seed?.birthPlace ?? '',
    gender: seed?.gender ?? '',
    fatherName: seed?.fatherName ?? '',
    motherName: seed?.motherName ?? '',
    checkIn: seed?.checkIn ?? '',
    checkOut: seed?.checkOut,
  };
}
