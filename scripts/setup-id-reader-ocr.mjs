#!/usr/bin/env node
/**
 * One-time setup for the local (fully on-premises) ID/passport OCR fallback.
 *
 * Downloads the Tesseract language model files ("traineddata") needed for
 * English + Turkish text recognition into lib/integrations/id-reader/tessdata/.
 * This is a ONE-TIME step you run on a machine with normal internet access
 * (your laptop, CI, etc.) — not something the production server needs to do
 * at request time.
 *
 * Why this matters for KVKK: by default tesseract.js downloads language data
 * from a CDN the first time each language is used. We deliberately disable
 * that (see ocr-engine.ts: langPath + gzip:false) so that, once this script
 * has been run, scanning a guest's ID/passport makes ZERO network calls —
 * the only things ever read from disk are these two language model files,
 * which contain no guest data whatsoever (they're generic font/character
 * recognition models, identical for every Tesseract user worldwide).
 *
 * Usage:
 *   node scripts/setup-id-reader-ocr.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const DEST_DIR = path.join(process.cwd(), 'lib', 'integrations', 'id-reader', 'tessdata');

// tessdata_fast = smaller/faster integerized LSTM models, packaged for
// Debian/Ubuntu — plenty accurate for printed ID/passport text. Plain
// (non-gzipped) files, matching gzip:false in ocr-engine.ts.
const FILES = {
  'eng.traineddata': 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata',
  'tur.traineddata': 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/tur.traineddata',
};

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        download(res.headers.location, destPath).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (err) => {
      file.close();
      fs.rmSync(destPath, { force: true });
      reject(err);
    });
  });
}

async function main() {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  for (const [name, url] of Object.entries(FILES)) {
    const dest = path.join(DEST_DIR, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`✓ ${name} already present, skipping`);
      continue;
    }
    console.log(`↓ downloading ${name} ...`);
    await download(url, dest);
    console.log(`✓ ${name} saved to ${dest}`);
  }
  console.log('\nDone. The local ID/passport OCR fallback can now run fully offline.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  console.error(
    'You can also download the two files manually from\n' +
      '  https://github.com/tesseract-ocr/tessdata_fast\n' +
      `and place them in ${DEST_DIR}`,
  );
  process.exit(1);
});
