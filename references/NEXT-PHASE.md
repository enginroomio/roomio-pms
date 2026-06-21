# Sonraki Faz Planı

> **Güncel oturum:** Faz 4 uygulandı  
> **Bir sonraki oturum:** Production deploy, canlı cihaz doğrulama, APM

---

## Faz 4 (bu oturum) — tamamlandı

| # | İş | Durum |
|---|-----|--------|
| 1 | **Canlı entegrasyon job** | ✅ `ROOMIO_INTEGRATION_LIVE=1`, `test:integrations:live`, GitHub workflow |
| 2 | **Form sürükle-bırak** | ✅ `FormDesignEditor` DnD parity |
| 3 | **Staging deploy** | ✅ `deploy-staging.yml` + Docker health check |
| 4 | **Monitoring** | ✅ Health: uptime, memory, integrations, sentry/push durumu |
| 5 | **HK push** | ✅ VAPID API, subscribe, SW push handler, mobil buton |

---

## Komutlar

```bash
npm run auto              # güncel port bul + 4 adımlı test
npm run auto:open         # test + tarayıcı (doğru port)
npm run auto:prune        # eski portları kapat + test
npm run open              # bul, aç, test et
npm run restart           # sunucu + otomatik test
npm run fix               # zorla rebuild + test
npm run test:faz5
npm run test:faz6
npm run test:faz7         # tek adım: npm run test:faz7 -- --step 7.3
npm run test:faz8         # tek adım: npm run test:faz8 -- --step 8.3
npm run test:faz9         # tek adım: npm run test:faz9 -- --step 9.1
npm run test:faz10        # tek adım: npm run test:faz10 -- --step 10.3
npm run test:production-ready
npm run test:secrets
npm run test:push-mobile
npm run deploy:fly
npm run test:integrations
ROOMIO_INTEGRATION_LIVE=1 npm run test:integrations:live
docker build -t roomio-pms:staging .
```

### Canlı entegrasyon

```bash
export ROOMIO_INTEGRATION_LIVE=1
npm run test:integrations:live
```

GitHub Actions → **Live integrations** (workflow_dispatch)

### HK push

```bash
npx web-push generate-vapid-keys
# .env → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
```

Mobil: `/housekeeping/mobile` → **Bildirimleri aç**

---

## Faz 5 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 5.1 Production deploy | ✅ | `Dockerfile`, `docker-compose.prod.yml`, `npm run test:docker` |
| 5.2 Canlı entegrasyon durumu | ✅ | `GET /api/integrations/status` |
| 5.3 Monitoring | ✅ | Health `monitoring` + Sentry stub (`lib/monitoring/errors.ts`) |
| 5.4 HK push gönderimi | ✅ | `POST /api/push/send` (503 VAPID yokken) |
| 5.5 Şablon paylaşımı | ✅ | `POST /api/reports/templates/share` |

**Test:** `npm run test:faz5
npm run test:faz6
npm run test:deploy
npm run vapid:gen` → aktif port `.roomio/runtime/active-port.txt` (şu an **3108**)

**Not:** 3100'de eski zombie süreç takılı kalırsa canary (`/api/integrations/status`) otomatik yeni porta geçer.

---

## Faz 6 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 6.1 Production deploy | ✅ | `fly.toml`, `deploy-production.yml`, `npm run test:deploy` |
| 6.2 Canlı entegrasyon | ✅ | `/api/integrations/status` + `test:integrations:live` (LIVE=1) |
| 6.3 Sentry SDK | ✅ | `@sentry/node`, `/api/monitoring/status` |
| 6.4 VAPID + push | ✅ | `npm run vapid:gen`, push send 503/200 |
| 6.5 Şablon paylaşım UI | ✅ | `TemplateSharePanel` + share API test |

**Test:** `npm run test:faz6` → aktif port `.roomio/runtime/active-port.txt` (şu an **3119**)

**VAPID üret:** `npm run vapid:gen` → `.env.vapid.generated`

**Canlı cihaz:** `ROOMIO_INTEGRATION_LIVE=1 npm run test:integrations:live`

---

## Faz 7 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 7.1 Fly / Railway deploy | ✅ | `fly.toml`, `railway.toml`, `npm run deploy:fly` |
| 7.2 Sentry production | ✅ | `/api/monitoring/status` (+ `SENTRY_DSN` ile ping) |
| 7.3 VAPID + push | ✅ | `npm run vapid:gen`, push 503/200 |
| 7.4 Canlı entegrasyon | ✅ | Status API + `test:integrations` / LIVE modu |
| 7.5 Form şablon paylaşımı | ✅ | Forms tab **Paylaş** + share API |

**Test:** `npm run test:faz7` — tek adım: `npm run test:faz7 -- --step 7.3`

**Aktif port:** `.roomio/runtime/active-port.txt` (şu an **3120**)

---

## Faz 8 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 8.1 Production deploy hazırlık | ✅ | `test:production-ready`, fly/railway/compose |
| 8.2 Production secrets | ✅ | `test:secrets`, monitoring status |
| 8.3 Mobil HK push | ✅ | `test:push-mobile` (+ VAPID sunucu 3121) |
| 8.4 Canlı entegrasyon | ✅ | Status API + simülasyon / LIVE modu |

**Test:** `npm run test:faz8` — tek adım: `npm run test:faz8 -- --step 8.3`

**Push VAPID sunucuya eklemek:** `.env.vapid.generated` → `.env.local` + restart

**Aktif port:** `.roomio/runtime/active-port.txt` (şu an **3120**)

---

## Faz 9 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 9.1 VAPID ana sunucuda | ✅ | `.env` + push send `[200]` |
| 9.2 Production deploy | ✅ | fly/railway + `test:production-ready` |
| 9.3 Production secrets | ✅ | JWT/DB/Redis + VAPID şablonları |
| 9.4 Mobil HK push | ✅ | subscribe + send pipeline |
| 9.5 Canlı entegrasyon | ✅ | Status API + 5/5 simülasyon |

**Test:** `npm run test:faz9` — tek adım: `npm run test:faz9 -- --step 9.1`

**Aktif port:** `.roomio/runtime/active-port.txt` (şu an **3124**)

**Tarayıcı:** http://127.0.0.1:3124 — HK mobil: `/housekeeping/mobile`

---

## Faz 10 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 10.1 Production deploy | ✅ | fly/railway + `test:production-ready` |
| 10.2 Production secrets | ✅ | secrets + docker prod compose |
| 10.3 Mobil HK UI + push | ✅ | Tarayıcı doğrulama + push API |
| 10.4 Canlı entegrasyon | ✅ | Status API + simülasyon / LIVE |

**Test:** `npm run test:faz10` — tek adım: `npm run test:faz10 -- --step 10.3`

**Aktif port:** `.roomio/runtime/active-port.txt` (şu an **3124**)

**Mobil push:** http://127.0.0.1:3124/housekeeping/mobile → Bildirimleri aç (gerçek cihazda test)

---

## Faz 11 — otomatik deploy (token)

| Adım | Durum | Not |
|------|-------|-----|
| 11.1 Fly production deploy | ✅ | `npm run deploy:faz11` + `.env.fly` token |
| 11.2 Fly secrets | ✅ | `npm run fly:secrets:check` |
| 11.3 Telefon push (HTTPS) | 🔧 | Production URL + VAPID |
| 11.4 Sahada canlı entegrasyon | 🔧 | `ROOMIO_INTEGRATION_LIVE=1` |

**Deploy (Terminal gerekmez):**
```bash
cp .env.fly.example .env.fly   # FLY_API_TOKEN=fo1_...
npm run deploy:faz11
```

---

## Faz 12 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 12.1 Sentry monitoring | ✅ | `npm run test:sentry` |
| 12.2 PostgreSQL / Fly Postgres | ✅ | `npm run test:postgres` |
| 12.3 Sahada canlı döngü | ✅ | Simülasyon + LIVE mod |

**Test:** `npm run test:faz12`

---

## Faz 13 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 13.1 Multi-property | ✅ | İstanbul + Antalya |
| 13.2 EGM/KBS canlı | ✅ | Gateway + simülasyon |
| 13.3 SLA dashboard | ✅ | `/tools/sla` |

**Test:** `npm run test:faz13`

---

## Faz 14 — tamamlandı (21 Haz 2026)

| Adım | Durum | Not |
|------|-------|-----|
| 14.1 EGM gateway canlı | ✅ | `npm run test:egm:live` |
| 14.2 Fly Postgres production | ✅ | `npm run fly:postgres:setup` |
| 14.3 Konsolide rapor | ✅ | `/reports?tab=consolidated` |

**Test:** `npm run test:faz14` — tüm regresyon geçti (port 3171)

**Deploy:** `cd ~/Projects/roomio-pms && npm run deploy:faz11`

---

## Faz 15 — Render (ücretsiz, kredi kartı yok)

| Adım | Durum | Not |
|------|-------|-----|
| 15.1 Production deploy | 🔧 | **Render** — `npm run deploy:render` |
| 15.2 Telefon push (HTTPS) | 🔧 | `https://roomio-pms.onrender.com` |
| 15.3 Postgres (opsiyonel) | ℹ | Free tier SQLite; kalıcı veri için Neon |
| 15.4 EGM gateway sahada | 🔧 | `ROOMIO_EGM_GATEWAY_URL` |

**Neden Render?** Fly.io kredi kartı ister; Render free tier kart istemez, HTTPS verir.

**Deploy:**
```bash
cd ~/Projects/roomio-pms
npm run deploy:render          # adım adım rehber
npm run vapid:gen              # VAPID → Render dashboard
# render.com → Blueprint → GitHub repo bağla
ROOMIO_PRODUCTION_URL=https://roomio-pms.onrender.com npm run test:render
```

**Not:** Free plan 15 dk sonra uyur; ilk açılış 30–60 sn sürebilir (cold start).

**Fly (ücretli alternatif):** `npm run deploy:faz15` (~5$/ay, kart gerekir)

**Denetim:** `references/PROJECT-AUDIT.md`
