import type { EgmGender, EgmIdType } from '@/lib/egm/types';
import { egmRequiredFields } from '@/lib/egm/types';
import type { IdScanDocument } from '@/lib/integrations/id-reader/types';

export type IdScanValidation = {
  ok: boolean;
  score: number;
  errors: string[];
  warnings: string[];
};

/** T.C. kimlik no algoritması (11 hane) */
export function isValidTckn(value: string): boolean {
  const n = value.replace(/\D/g, '');
  if (!/^\d{11}$/.test(n)) return false;
  if (n[0] === '0') return false;
  const digits = n.split('').map(Number);
  const odd = digits[0]! + digits[2]! + digits[4]! + digits[6]! + digits[8]!;
  const even = digits[1]! + digits[3]! + digits[5]! + digits[7]!;
  const d10 = ((odd * 7) - even) % 10;
  if (d10 !== digits[9]) return false;
  const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d11 === digits[10];
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeGender(raw?: string): EgmGender | '' {
  const g = (raw ?? '').trim().toUpperCase();
  if (g === 'E' || g === 'M' || g === 'MALE' || g === 'ERKEK') return 'E';
  if (g === 'K' || g === 'F' || g === 'FEMALE' || g === 'KADIN') return 'K';
  return '';
}

export function inferIdType(doc: Partial<IdScanDocument>): EgmIdType {
  if (doc.idType === 'TCKN' || doc.idType === 'PASSPORT' || doc.idType === 'OTHER') return doc.idType;
  const no = (doc.documentNo ?? '').replace(/\s/g, '');
  if (/^\d{11}$/.test(no)) return 'TCKN';
  if (/^[A-Z0-9]{6,12}$/i.test(no)) return 'PASSPORT';
  return doc.nationality?.toUpperCase() === 'TR' ? 'TCKN' : 'PASSPORT';
}

export function validateIdScanDocument(doc: Partial<IdScanDocument>): IdScanValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const firstName = doc.firstName?.trim() ?? '';
  const lastName = doc.lastName?.trim() ?? '';
  const documentNo = (doc.documentNo ?? '').trim();
  const nationality = (doc.nationality ?? '').trim().toUpperCase();
  const idType = inferIdType(doc);
  const gender = normalizeGender(doc.gender);

  if (!firstName) {
    errors.push('Ad okunamadı');
    score -= 25;
  }
  if (!lastName) {
    errors.push('Soyad okunamadı');
    score -= 25;
  }
  if (!documentNo) {
    errors.push('Belge numarası okunamadı');
    score -= 30;
  } else if (idType === 'TCKN' && !isValidTckn(documentNo)) {
    errors.push('T.C. kimlik numarası geçersiz (kontrol hanesi uyuşmuyor)');
    score -= 40;
  } else if (idType === 'PASSPORT' && documentNo.length < 5) {
    warnings.push('Pasaport numarası kısa görünüyor — kontrol edin');
    score -= 10;
  }

  if (!nationality) {
    warnings.push('Uyruk okunamadı — manuel seçin');
    score -= 8;
  }

  const birth = parseIsoDate(doc.birthDate ?? '');
  if (!birth) {
    errors.push('Doğum tarihi okunamadı veya geçersiz');
    score -= 15;
  } else if (birth > new Date()) {
    errors.push('Doğum tarihi gelecekte olamaz');
    score -= 20;
  }

  if (!doc.birthPlace?.trim()) {
    warnings.push('Doğum yeri okunamadı — manuel girin');
    score -= 8;
  }
  if (!gender) {
    warnings.push('Cinsiyet okunamadı — manuel seçin');
    score -= 8;
  }
  if (!doc.fatherName?.trim()) {
    warnings.push('Baba adı okunamadı — manuel girin');
    score -= 6;
  }
  if (!doc.motherName?.trim()) {
    warnings.push('Anne adı okunamadı — manuel girin');
    score -= 6;
  }

  if (nationality === 'TR' && idType === 'PASSPORT' && /^\d{11}$/.test(documentNo.replace(/\D/g, ''))) {
    warnings.push('Türk vatandaşı için belge tipi T.C. Kimlik olmalı');
    score -= 5;
  }

  if (typeof doc.confidence === 'number') {
    if (doc.confidence < 0.85) {
      warnings.push(`Okuma güven skoru düşük (%${Math.round(doc.confidence * 100)}) — personel onayı gerekli`);
      score = Math.min(score, Math.round(doc.confidence * 100));
    }
  }

  return {
    ok: errors.length === 0,
    score: Math.max(0, Math.min(100, score)),
    errors,
    warnings,
  };
}

export function validateEgmFormForCheckIn(form: {
  firstName?: string;
  lastName?: string;
  nationality?: string;
  idNo?: string;
  idType?: EgmIdType;
  birthDate?: string;
  birthPlace?: string;
  gender?: EgmGender | '';
  fatherName?: string;
  motherName?: string;
  roomNo?: string;
  checkIn?: string;
}): IdScanValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const missing = egmRequiredFields(form);
  if (missing.length > 0) {
    errors.push(`Eksik EGM alanları: ${missing.join(', ')}`);
  }

  if (form.idType === 'TCKN' && form.idNo && !isValidTckn(form.idNo)) {
    errors.push('T.C. kimlik numarası geçersiz');
  }

  const birth = parseIsoDate(form.birthDate ?? '');
  if (form.birthDate && !birth) errors.push('Doğum tarihi geçersiz');
  if (birth && birth > new Date()) errors.push('Doğum tarihi gelecekte olamaz');

  if (!form.roomNo?.trim()) {
    warnings.push('Oda numarası henüz seçilmedi');
  }

  return {
    ok: errors.length === 0,
    score: errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0,
    errors,
    warnings,
  };
}
