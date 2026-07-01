/**
 * Hand-rolled ICAO 9303 MRZ (Machine Readable Zone) parser.
 *
 * No external dependency — pure string/checksum logic. Supports:
 *  - TD3: passports and the MRZ-equipped Turkish chip ID card front side
 *         is NOT TD3, but passports and many foreign ID/travel docs are
 *         (2 lines x 44 chars).
 *  - TD1: ID cards (3 lines x 30 chars) — this is the layout used on the
 *         back of post-2017 Turkish chip kimlik kartı.
 *
 * Privacy note: this module only ever receives already-OCR'd plain text
 * (a string), never image bytes. It performs no I/O — no disk, no network,
 * no database. It is pure, synchronous, and side-effect free.
 */

import type { EgmIdType } from '@/lib/egm/types';
import type { IdScanDocument } from '@/lib/integrations/id-reader/types';

export type ParsedMrz = {
  documentNo: string;
  nationality: string; // 2-letter when known, otherwise raw MRZ 3-letter code
  issuingCountry: string;
  birthDateIso: string;
  expiryDateIso: string;
  sex: 'E' | 'K' | '';
  surname: string;
  givenNames: string;
  docTypeChar: string;
  checksums: { docNo: boolean; birth: boolean; expiry: boolean; composite: boolean | null };
  allRequiredChecksumsValid: boolean;
  /** The raw MRZ lines, joined — same data as the structured fields above, just verbatim. */
  rawText: string;
};

const MRZ_CHARSET = /^[A-Z0-9<]+$/;

/** ICAO 9303 character value: '<' = 0, digit = itself, letter = 10 + (A=0). */
function mrzCharValue(ch: string): number {
  if (ch === '<') return 0;
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return 10 + (ch.charCodeAt(0) - 65);
  return 0;
}

const WEIGHTS = [7, 3, 1];

/** Weighted mod-10 MRZ check digit over an arbitrary-length field. */
export function mrzCheckDigit(field: string): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    sum += mrzCharValue(field[i]!) * WEIGHTS[i % 3]!;
  }
  return sum % 10;
}

function checkDigitMatches(field: string, checkChar: string): boolean {
  if (!/^\d$/.test(checkChar)) return false;
  return mrzCheckDigit(field) === Number(checkChar);
}

/** YYMMDD -> ISO date. Birth dates pivot on the current year; expiry dates are always 20xx. */
function yymmddToIso(yymmdd: string, kind: 'birth' | 'expiry'): string {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  let century: number;
  if (kind === 'expiry') {
    century = 2000;
  } else {
    const currentYy = new Date().getFullYear() % 100;
    century = yy > currentYy ? 1900 : 2000;
  }
  const year = century + yy;
  if (Number(mm) < 1 || Number(mm) > 12) return '';
  if (Number(dd) < 1 || Number(dd) > 31) return '';
  return `${year}-${mm}-${dd}`;
}

function mrzSexToGender(ch: string): 'E' | 'K' | '' {
  if (ch === 'M') return 'E';
  if (ch === 'F') return 'K';
  return '';
}

// Practical subset of ISO 3166-1 alpha-3 -> alpha-2, covering nationalities
// most commonly seen at a Turkish hotel front desk. Unknown codes are passed
// through as-is (uppercased 3-letter MRZ code) rather than guessed at, so
// staff can correct them manually in the EGM form — never silently wrong.
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  TUR: 'TR', DEU: 'DE', GBR: 'GB', USA: 'US', FRA: 'FR', NLD: 'NL', RUS: 'RU',
  BGR: 'BG', GEO: 'GE', AZE: 'AZ', IRN: 'IR', IRQ: 'IQ', SYR: 'SY', UKR: 'UA',
  POL: 'PL', ROU: 'RO', GRC: 'GR', ITA: 'IT', ESP: 'ES', CHN: 'CN', ARE: 'AE',
  SAU: 'SA', KWT: 'KW', QAT: 'QA', BIH: 'BA', ALB: 'AL', MKD: 'MK', SRB: 'RS',
  AUT: 'AT', CHE: 'CH', BEL: 'BE', SWE: 'SE', NOR: 'NO', DNK: 'DK', FIN: 'FI',
  PRT: 'PT', IRL: 'IE', CZE: 'CZ', SVK: 'SK', HUN: 'HU', HRV: 'HR', SVN: 'SI',
  EGY: 'EG', LBY: 'LY', TUN: 'TN', MAR: 'MA', JOR: 'JO', LBN: 'LB', ISR: 'IL',
  PSE: 'PS', PAK: 'PK', IND: 'IN', AFG: 'AF', KAZ: 'KZ', UZB: 'UZ', TKM: 'TM',
  TJK: 'TJ', KGZ: 'KG', ARM: 'AM', MDA: 'MD', BLR: 'BY', LTU: 'LT', LVA: 'LV',
  EST: 'EE', CAN: 'CA', AUS: 'AU', JPN: 'JP', KOR: 'KR', BRA: 'BR', MEX: 'MX',
  CYP: 'CY', LUX: 'LU', MLT: 'MT', ISL: 'IS', MNE: 'ME', KOS: 'XK',
};

function mrzCountryToIso(code3: string): string {
  const c = code3.toUpperCase().replace(/</g, '');
  if (!c) return '';
  return ALPHA3_TO_ALPHA2[c] ?? c;
}

function inferIdTypeFromMrz(docTypeChar: string, issuingCountry: string): EgmIdType {
  if (docTypeChar === 'P') return 'PASSPORT';
  if (docTypeChar === 'I' || docTypeChar === 'A' || docTypeChar === 'C') {
    return issuingCountry.toUpperCase().includes('TUR') ? 'TCKN' : 'OTHER';
  }
  return 'OTHER';
}

function splitMrzName(nameField: string): { surname: string; givenNames: string } {
  const parts = nameField.split('<<');
  const surname = (parts[0] ?? '').replace(/</g, ' ').trim();
  const givenNames = (parts[1] ?? '').replace(/</g, ' ').trim();
  return { surname, givenNames };
}

/** Parses a TD3 (passport, 2 x 44) MRZ pair. Returns null if the lines aren't a valid TD3 MRZ. */
export function parseTd3(line1: string, line2: string): ParsedMrz | null {
  if (line1.length !== 44 || line2.length !== 44) return null;
  if (!MRZ_CHARSET.test(line1) || !MRZ_CHARSET.test(line2)) return null;
  if (line1[0] !== 'P') return null;

  const issuingCountry = line1.slice(2, 5);
  const nameField = line1.slice(5, 44);
  const { surname, givenNames } = splitMrzName(nameField);

  const documentNo = line2.slice(0, 9).replace(/</g, '');
  const docNoCheckOk = checkDigitMatches(line2.slice(0, 9), line2[9]!);
  const nationality3 = line2.slice(10, 13);
  const birthField = line2.slice(13, 19);
  const birthCheckOk = checkDigitMatches(birthField, line2[19]!);
  const sex = line2[20]!;
  const expiryField = line2.slice(21, 27);
  const expiryCheckOk = checkDigitMatches(expiryField, line2[27]!);

  const compositeInput = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43);
  const compositeOk = checkDigitMatches(compositeInput, line2[43]!);

  if (!documentNo || !docNoCheckOk || !birthCheckOk || !expiryCheckOk) return null;

  return {
    documentNo,
    nationality: mrzCountryToIso(nationality3),
    issuingCountry: mrzCountryToIso(issuingCountry),
    birthDateIso: yymmddToIso(birthField, 'birth'),
    expiryDateIso: yymmddToIso(expiryField, 'expiry'),
    sex: mrzSexToGender(sex),
    surname,
    givenNames,
    docTypeChar: line1[0]!,
    checksums: { docNo: docNoCheckOk, birth: birthCheckOk, expiry: expiryCheckOk, composite: compositeOk },
    allRequiredChecksumsValid: docNoCheckOk && birthCheckOk && expiryCheckOk,
    rawText: `${line1}\n${line2}`,
  };
}

/** Parses a TD1 (ID card, 3 x 30) MRZ triple. Returns null if the lines aren't a valid TD1 MRZ. */
export function parseTd1(line1: string, line2: string, line3: string): ParsedMrz | null {
  if (line1.length !== 30 || line2.length !== 30 || line3.length !== 30) return null;
  if (!MRZ_CHARSET.test(line1) || !MRZ_CHARSET.test(line2) || !MRZ_CHARSET.test(line3)) return null;
  if (!['I', 'A', 'C'].includes(line1[0]!)) return null;

  const issuingCountry = line1.slice(2, 5);
  const documentNo = line1.slice(5, 14).replace(/</g, '');
  const docNoCheckOk = checkDigitMatches(line1.slice(5, 14), line1[14]!);

  const birthField = line2.slice(0, 6);
  const birthCheckOk = checkDigitMatches(birthField, line2[6]!);
  const sex = line2[7]!;
  const expiryField = line2.slice(8, 14);
  const expiryCheckOk = checkDigitMatches(expiryField, line2[14]!);
  const nationality3 = line2.slice(15, 18);

  const compositeInput = line1.slice(5, 30) + line2.slice(0, 7) + line2.slice(8, 15) + line2.slice(18, 29);
  const compositeOk = checkDigitMatches(compositeInput, line2[29]!);

  if (!documentNo || !docNoCheckOk || !birthCheckOk || !expiryCheckOk) return null;

  const { surname, givenNames } = splitMrzName(line3);

  return {
    documentNo,
    nationality: mrzCountryToIso(nationality3),
    issuingCountry: mrzCountryToIso(issuingCountry),
    birthDateIso: yymmddToIso(birthField, 'birth'),
    expiryDateIso: yymmddToIso(expiryField, 'expiry'),
    sex: mrzSexToGender(sex),
    surname,
    givenNames,
    docTypeChar: line1[0]!,
    checksums: { docNo: docNoCheckOk, birth: birthCheckOk, expiry: expiryCheckOk, composite: compositeOk },
    allRequiredChecksumsValid: docNoCheckOk && birthCheckOk && expiryCheckOk,
    rawText: `${line1}\n${line2}\n${line3}`,
  };
}

function normalizeOcrLine(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9<]/g, '');
}

/**
 * Scans free-form OCR text for an MRZ block and parses it. Tries TD3
 * (passport, 2x44) first, then TD1 (ID card, 3x30). Returns null if no
 * checksum-valid MRZ block is found — caller should fall back to label-based
 * extraction (see ocr-extract.ts) in that case.
 */
export function findAndParseMrz(ocrText: string): ParsedMrz | null {
  const rawLines = ocrText.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean);

  // TD3: look for two consecutive lines close to 44 chars (pad/trim minor OCR noise).
  const td3Candidates = rawLines.filter((l) => l.length >= 42 && l.length <= 46);
  for (let i = 0; i < td3Candidates.length - 1; i++) {
    const l1 = td3Candidates[i]!.padEnd(44, '<').slice(0, 44);
    const l2 = td3Candidates[i + 1]!.padEnd(44, '<').slice(0, 44);
    const parsed = parseTd3(l1, l2);
    if (parsed) return parsed;
  }

  // TD1: look for three consecutive lines close to 30 chars.
  const td1Candidates = rawLines.filter((l) => l.length >= 28 && l.length <= 32);
  for (let i = 0; i < td1Candidates.length - 2; i++) {
    const l1 = td1Candidates[i]!.padEnd(30, '<').slice(0, 30);
    const l2 = td1Candidates[i + 1]!.padEnd(30, '<').slice(0, 30);
    const l3 = td1Candidates[i + 2]!.padEnd(30, '<').slice(0, 30);
    const parsed = parseTd1(l1, l2, l3);
    if (parsed) return parsed;
  }

  return null;
}

/** Maps a successfully-parsed, checksum-valid MRZ into the IdScanDocument shape. */
export function mrzToIdScanDocument(mrz: ParsedMrz): IdScanDocument {
  return {
    firstName: mrz.givenNames,
    lastName: mrz.surname,
    nationality: mrz.nationality || mrz.issuingCountry,
    documentNo: mrz.documentNo,
    idType: inferIdTypeFromMrz(mrz.docTypeChar, mrz.issuingCountry),
    birthDate: mrz.birthDateIso,
    gender: mrz.sex,
    expiryDate: mrz.expiryDateIso,
    mrz: mrz.rawText,
    confidence: mrz.checksums.composite ? 0.97 : 0.93,
  };
}
