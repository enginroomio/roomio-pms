#!/usr/bin/env node
/** Render.com build — bellek yetersizse GitHub Actions + GHCR kullanın. */
console.log(`
Render free tier Next.js build OOM veriyor (~512MB).

Çözüm: GitHub Actions Docker image → Render "Existing Image"

1. GitHub → Actions → "Render GHCR" workflow çalışsın (push sonrası otomatik)
2. github.com/enginroomio?tab=packages → roomio-pms → Public visibility
3. Render → Delete mevcut Node servisi
4. New + → Web Service → Existing Image
   Image: ghcr.io/enginroomio/roomio-pms:latest
   Plan: Free
   Health: /api/health
   PORT: 3100 (Render otomatik PORT verir — docker-entrypoint okur)
5. Environment: VAPID + DATABASE_URL=file:/tmp/roomio.db

Alternatif (yerel HTTPS): npm run tunnel:https
`);
