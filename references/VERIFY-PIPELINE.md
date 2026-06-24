# Roomio — Otomatik Doğrulama Pipeline

Tek komut, sıfır bekleme — aşamalar otomatik zincirlenir:

```bash
npm run verify:pipeline
```

## Aktif aşamalar

| # | Aşama | Script | Süre (tipik) |
|---|--------|--------|----------------|
| 1 | API tam | `verify:all` — typecheck, checklist, 57 route, ~160 E2E API (api-protected 5 batch + sunucu yenileme) | ~8–12 dk |
| 2 | UI rollout | `verify:ui` — kabuk, rezervasyon, resepsiyon, folio UI (chromium) | ~2–5 dk |
| 3 | Production build | `VERIFY_BUILD=1` + `next start` + tam API E2E | ~8–12 dk |
| 4 | Auth-required | `verify:auth` — `ROOMIO_AUTH_REQUIRED=1` + JWT 401/403 | ~2–3 dk |
| 5 | Tam rollout | `verify:rollout` — 10× `rollout-*.spec.ts` | ~5–10 dk |
| 6 | Docker deploy | `test:docker` — build + health (Docker yoksa dosya doğrulama) | ~3–8 dk |
| 7 | Canlı URL | `ROOMIO_PUBLIC_URL=… deploy:checklist` | ~1 dk |

Aşama 1 bitince sunucu açık kalır → Aşama 2 aynı sunucuda koşar → sonraki aşamalar otomatik devam eder.

## Atlama

```bash
VERIFY_SKIP_UI=1 npm run verify:pipeline       # UI atla
VERIFY_SKIP_PROD=1 npm run verify:pipeline      # build atla
VERIFY_SKIP_AUTH=1 npm run verify:pipeline      # auth-required atla
VERIFY_SKIP_ROLLOUT=1 npm run verify:pipeline   # tam rollout atla
VERIFY_SKIP_DOCKER=1 npm run verify:pipeline    # docker atla
VERIFY_SKIP_LIVE=1 npm run verify:pipeline      # canlı URL atla
```

Hızlı CI döngüsü (sadece API + auth):

```bash
VERIFY_SKIP_UI=1 VERIFY_SKIP_PROD=1 VERIFY_SKIP_ROLLOUT=1 VERIFY_SKIP_DOCKER=1 npm run verify:pipeline
```

## Alt komutlar

| Komut | Ne zaman |
|-------|----------|
| `npm run verify:quick` | Dev sunucu açıkken hızlı döngü |
| `npm run verify:all` | Sadece API tam |
| `npm run verify:ui` | Sadece UI rollout (8 spec) |
| `npm run verify:auth` | Sadece auth-required smoke |
| `npm run verify:rollout` | Sadece tam rollout (10 spec) |
| `npm run verify` | Hızlı CI — API + auth (~7 dk), varsayılan |
| `npm run verify:ci` | `verify` ile aynı |
| `npm run setup:auto` | Kurulum + `verify:ci` otomatik zincir |
| `npm run verify:pipeline` | Tam 7 aşama |

## Canlı deploy öncesi

```bash
ROOMIO_PUBLIC_URL=https://your-domain npm run verify:pipeline
```

Aşama 7 otomatik olarak canlı URL üzerinde `deploy:checklist` çalıştırır.
