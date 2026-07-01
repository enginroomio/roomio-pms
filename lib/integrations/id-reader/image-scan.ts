/**
 * Orchestrates the local OCR + MRZ fallback pipeline for scanning an ID or
 * passport from a photo, as an alternative to the Kimlikokur hardware
 * reader (client.ts::scanIdDocument).
 *
 * Pipeline:
 *   1. Run local OCR once (tesseract.js, eng+tur) over the in-memory image.
 *   2. Tier 1: look for a checksum-valid ICAO 9303 MRZ block in the OCR text
 *      (passports + post-2017 Turkish chip kimlik kartı). High confidence.
 *   3. Tier 2: if no MRZ is found, fall back to label/regex extraction for
 *      pre-2017 Turkish ID cards. Lower confidence — always routed through
 *      manual staff review by validateIdScanDocument().
 *
 * PRIVACY: `imageInput` (the base64/data-URL image) exists only as a local
 * parameter in this function's call stack. It is passed straight into
 * runLocalOcr() (in-memory OCR, see ocr-engine.ts) and is never assigned to
 * `data.documentImageBase64` or any other field of the returned IdScanResult,
 * never logged, and never written to disk or the database. Once this
 * function returns, nothing in the codebase still references the image —
 * it is eligible for garbage collection immediately.
 */

import { runLocalOcr } from '@/lib/integrations/id-reader/ocr-engine';
import { findAndParseMrz, mrzToIdScanDocument } from '@/lib/integrations/id-reader/mrz';
import { extractFieldsFromOcrText } from '@/lib/integrations/id-reader/ocr-extract';
import { validateIdScanDocument } from '@/lib/integrations/id-reader/validate';
import type { IdScanDocument, IdScanResult } from '@/lib/integrations/id-reader/types';

// ~12MB of base64 (~9MB raw image) — generous for a phone/tablet photo of a
// single document, while keeping an explicit, deliberate bound on how much
// image data this process will ever hold in memory at once.
const MAX_BASE64_LENGTH = 12 * 1024 * 1024;

/** Ensures the string is a proper `data:image/...;base64,...` URL, which is
 * what tesseract.js expects for in-memory (non-file, non-network) images. If
 * the caller already sent a data URL, it's passed through unchanged;
 * otherwise it's assumed to be raw base64 and wrapped. */
function ensureDataUrl(input: string): string {
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(input)) return input;
  return `data:image/jpeg;base64,${input}`;
}

export async function scanIdDocumentFromImage(
  imageInput: string,
  // Accepted for API symmetry with scanIdDocument(deviceId, reservationId);
  // not currently used by the OCR pipeline itself.
  _reservationId?: string,
): Promise<IdScanResult> {
  if (!imageInput || typeof imageInput !== 'string') {
    return { ok: false, message: 'Görsel verisi alınamadı' };
  }
  if (imageInput.length > MAX_BASE64_LENGTH) {
    return { ok: false, message: 'Görsel çok büyük — lütfen daha düşük çözünürlükte çekin' };
  }

  let ocrText: string;
  try {
    const ocr = await runLocalOcr(ensureDataUrl(imageInput));
    ocrText = ocr.text;
  } catch (e) {
    return {
      ok: false,
      message: `Yerel OCR çalıştırılamadı: ${e instanceof Error ? e.message : 'bilinmeyen hata'}`,
    };
  }
  // `imageInput` is not referenced again below — only `ocrText` (plain
  // recognized text, no image bytes) flows into the rest of the pipeline.

  let data: IdScanDocument | null = null;
  let tier: 'mrz' | 'label' | null = null;

  const mrz = findAndParseMrz(ocrText);
  if (mrz) {
    data = mrzToIdScanDocument(mrz);
    tier = 'mrz';
  } else {
    const labelResult = extractFieldsFromOcrText(ocrText);
    if (labelResult) {
      data = { ...labelResult.doc, confidence: labelResult.confidence } as IdScanDocument;
      tier = 'label';
    }
  }

  if (!data) {
    return {
      ok: false,
      message: 'Belgeden okunabilir bir kimlik/pasaport alanı bulunamadı — netlik/ışık kontrol edip tekrar deneyin',
    };
  }

  const validation = validateIdScanDocument(data);
  const tierLabel = tier === 'mrz' ? 'MRZ (yüksek güven)' : 'etiket okuma (manuel kontrol gerekli)';
  return {
    ok: validation.ok,
    simulated: false,
    message: validation.ok
      ? `Yerel OCR — ${tierLabel}, tarama başarılı (güven %${validation.score})`
      : `Yerel OCR — ${tierLabel}, doğrulama hatası var`,
    data,
    validation,
  };
}
