/**
 * Tier-2 fallback extractor: label/regex based field extraction from OCR'd
 * text, for documents that have no parseable MRZ (mainly pre-2017 Turkish
 * "mavi/pembe" ID cards, which predate the ICAO 9303 chip kimlik kartı and
 * its MRZ strip).
 *
 * This is intentionally lower-confidence than MRZ parsing (no checksum to
 * verify against) — confidence is capped well below the auto-approve
 * threshold so the existing manual-review gate in validate.ts always kicks
 * in for these reads.
 *
 * Like mrz.ts, this module only works on already-OCR'd plain text. No I/O,
 * no image bytes ever touch this file.
 */

import type { IdScanDocument } from '@/lib/integrations/id-reader/types';
import { isValidTckn } from '@/lib/integrations/id-reader/validate';

function normalizeText(text: string): string {
  return text
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .toUpperCase();
}

function linesOf(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Letter-boundary guard so a short label like "ADI" doesn't match inside a
// longer one like "SOYADI" (Turkish "ad" = first name is a literal substring
// of "soyad" = surname — a real collision risk for naive substring search).
const TR_LETTER_CLASS = 'A-ZÇĞİÖŞÜ';

/**
 * Looks for a label (one of several alternate spellings/languages) and
 * returns the value following it — either on the same line after a
 * separator, or on the next non-empty line if the label's own line has
 * nothing else on it.
 */
function extractByLabel(lines: string[], labels: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = normalizeText(lines[i]!);
    for (const label of labels) {
      const trimmed = label.trim();
      const re = new RegExp(
        `(?<![${TR_LETTER_CLASS}])${escapeRegExp(trimmed)}(?![${TR_LETTER_CLASS}])`,
      );
      const m = re.exec(line);
      if (!m) continue;
      const idx = m.index;
      const rest = lines[i]!.slice(idx + trimmed.length).replace(/^[\s:./-]+/, '').trim();
      if (rest) return rest;
      const next = lines[i + 1]?.trim();
      if (next && !labels.some((l) => normalizeText(next).includes(l))) return next;
    }
  }
  return null;
}

function parseTurkishDate(value: string): string {
  const m = value.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/);
  if (!m) return '';
  let [, dd, mm, yyyy] = m as unknown as [string, string, string, string];
  if (yyyy.length === 2) yyyy = (Number(yyyy) > 30 ? '19' : '20') + yyyy;
  const day = dd.padStart(2, '0');
  const month = mm.padStart(2, '0');
  if (Number(month) < 1 || Number(month) > 12) return '';
  if (Number(day) < 1 || Number(day) > 31) return '';
  return `${yyyy}-${month}-${day}`;
}

function findValidTckn(text: string): string | null {
  const candidates = text.match(/\b\d{11}\b/g) ?? [];
  for (const c of candidates) {
    if (isValidTckn(c)) return c;
  }
  return null;
}

function parseGender(value: string | null): 'E' | 'K' | '' {
  if (!value) return '';
  const v = normalizeText(value).trim();
  if (v.startsWith('E') || v.startsWith('M')) return 'E';
  if (v.startsWith('K') || v.startsWith('F')) return 'K';
  return '';
}

const LABELS = {
  surname: ['SOYADI', 'SOYAD', 'SURNAME'],
  firstName: ['ADI', 'AD ', 'GIVEN NAME', 'GIVEN NAMES', 'NAME'],
  birthDate: ['DOĞUM TARIHI', 'DOGUM TARIHI', 'DATE OF BIRTH', 'D.TARIHI'],
  birthPlace: ['DOĞUM YERI', 'DOGUM YERI', 'PLACE OF BIRTH'],
  gender: ['CINSIYETI', 'CINSIYET', 'SEX', 'GENDER'],
  fatherName: ['BABA ADI', "BABA ADı", 'FATHER'],
  motherName: ['ANA ADI', 'ANNE ADI', 'MOTHER'],
  nationality: ['UYRUĞU', 'UYRUGU', 'NATIONALITY'],
};

/**
 * Best-effort field extraction for old Turkish ID cards without MRZ.
 * Returns null if not even a valid TCKN + a name could be found (in that
 * case the read is too unreliable to surface — caller should report a
 * generic OCR failure instead).
 */
export function extractFieldsFromOcrText(ocrText: string): { doc: Partial<IdScanDocument>; confidence: number } | null {
  const lines = linesOf(ocrText);
  const fullText = ocrText;

  const lastName = extractByLabel(lines, LABELS.surname);
  const firstName = extractByLabel(lines, LABELS.firstName);
  const tckn = findValidTckn(fullText);
  const birthDateRaw = extractByLabel(lines, LABELS.birthDate);
  const birthPlace = extractByLabel(lines, LABELS.birthPlace);
  const genderRaw = extractByLabel(lines, LABELS.gender);
  const fatherName = extractByLabel(lines, LABELS.fatherName);
  const motherName = extractByLabel(lines, LABELS.motherName);

  const foundCount = [lastName, firstName, tckn, birthDateRaw, birthPlace, fatherName, motherName].filter(
    Boolean,
  ).length;

  // Require at least a checksum-valid TCKN plus one name field — otherwise
  // this almost certainly isn't a usable read and we shouldn't fabricate a
  // low-quality guess.
  if (!tckn || (!lastName && !firstName)) return null;

  const doc: Partial<IdScanDocument> = {
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    nationality: 'TR',
    documentNo: tckn,
    idType: 'TCKN',
    birthDate: birthDateRaw ? parseTurkishDate(birthDateRaw) : '',
    birthPlace: birthPlace ?? undefined,
    gender: parseGender(genderRaw),
    fatherName: fatherName ?? undefined,
    motherName: motherName ?? undefined,
  };

  // Cap well below the auto-approve threshold (0.85 in validate.ts) — this
  // path has no checksum to lean on, so it always routes through manual
  // staff review regardless of how many fields were found.
  const confidence = Math.min(0.7, 0.35 + foundCount * 0.06);

  return { doc, confidence };
}
