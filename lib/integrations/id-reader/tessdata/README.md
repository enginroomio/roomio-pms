# Tesseract language data (local OCR fallback)

This folder holds the Tesseract OCR language model files used by the local
ID/passport scanning fallback (`lib/integrations/id-reader/ocr-engine.ts`).

These files are NOT checked into git (they're binary blobs, a few MB each,
and identical for every Tesseract user — no guest data is involved). Run
once, on any machine with normal internet access:

```
node scripts/setup-id-reader-ocr.mjs
```

This downloads `eng.traineddata` and `tur.traineddata` into this folder.
After that, ID/passport OCR scanning runs fully offline — no network calls
are made at scan time, ever. See ocr-engine.ts for the full privacy
guarantee (the scanned image itself is never written to disk regardless).
