/**
 * Local (on-server) OCR engine wrapper around tesseract.js.
 *
 * ============================ PRIVACY GUARANTEE ============================
 * The scanned ID/passport image is held ONLY in this Node process's memory
 * for the duration of the OCR call:
 *   - It is never written to disk (no temp files — tesseract.js accepts the
 *     base64/data-URL image directly in memory).
 *   - It is never logged (the `logger` callback below is a no-op).
 *   - It is never cached (`cacheMethod: 'none'`).
 *   - It is never sent over the network — the OCR engine itself runs
 *     entirely locally; the only files it reads are the language model
 *     ("traineddata") files bundled in ./tessdata, loaded from local disk
 *     (`langPath`, `gzip: false`), never downloaded at scan time.
 *   - Only recognized TEXT is returned from runLocalOcr(); the image bytes
 *     go out of scope (and become eligible for GC) the moment this function
 *     returns. No caller in this codebase stores the image — see
 *     image-scan.ts, which discards it immediately after calling this.
 * =============================================================================
 */

import path from 'node:path';
import type { Worker } from 'tesseract.js';

const LANG_DATA_DIR = path.join(process.cwd(), 'lib', 'integrations', 'id-reader', 'tessdata');
const LANGS = 'eng+tur';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker(LANGS, 1, {
        langPath: LANG_DATA_DIR,
        gzip: false,
        cacheMethod: 'none',
        logger: () => {},
      });
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

export type LocalOcrResult = { text: string };

/**
 * Runs OCR fully in-process on an in-memory image. `imageInput` may be a
 * base64 data URL (`data:image/...;base64,...`) or a raw base64 string.
 * Returns only the recognized text — see the privacy guarantee above.
 */
export async function runLocalOcr(imageInput: string): Promise<LocalOcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageInput);
  return { text: data.text ?? '' };
}

/** Releases the OCR worker. Safe to call on process shutdown; not required per-request. */
export async function shutdownLocalOcr(): Promise<void> {
  if (!workerPromise) return;
  const current = workerPromise;
  workerPromise = null;
  const worker = await current.catch(() => null);
  await worker?.terminate();
}
