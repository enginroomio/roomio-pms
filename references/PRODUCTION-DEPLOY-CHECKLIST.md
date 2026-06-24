# Roomio PMS — Production Deploy Checklist

Canlıya almadan önce bu listeyi sırayla tamamlayın. Otomatik kontrol: `npm run deploy:checklist`.

## 1. Ortam değişkenleri

| Değişken | Zorunlu | Not |
|----------|---------|-----|
| `ROOMIO_JWT_SECRET` | Evet | En az 32 karakter, rastgele; örnek değer kullanmayın |
| `ROOMIO_AUTH_REQUIRED` | Evet (`1`) | Production'da oturum zorunlu |
| `DATABASE_URL` | Evet | PostgreSQL önerilir (`PRISMA_SCHEMA=postgresql`) |
| `REDIS_URL` | Önerilir | Oturum / kuyruk / cache için |
| `SENTRY_DSN` | Önerilir | Hata izleme |
| `VAPID_*` | HK push için | `npm run vapid:gen` |

Şablon: `.env.production.example`

## 2. Build ve test

```bash
npm ci
npm run verify:pipeline   # tam otomatik: API → UI → prod → auth → rollout → docker → canlı URL
npm run verify            # hızlı CI (API + auth, ~7 dk)
npm run setup:auto        # kurulum + verify:ci zinciri
```

Alternatifler: `verify:all`, `verify:quick`, `verify:ui` — `references/VERIFY-PIPELINE.md`

Tek komutla sıralı doğrulama (`verify:all`): typecheck → production-ready → dev sunucu → deploy checklist → route smoke → E2E API. `VERIFY_BUILD=1` production build de koşar.

Hızlı döngü (çalışan sunucu): `ROOMIO_URL=http://127.0.0.1:3100 npm run verify:quick`

UI rollout (chromium): `npm run verify:ui` veya pipeline aşama 2

E2E (isteğe bağlı, auth kapalı):

```bash
ROOMIO_AUTH_REQUIRED=0 npm run test:e2e
```

Playwright varsayılan olarak **3111** portunda ayrı dev sunucu başlatır (`PLAYWRIGHT_PORT` ile değiştirilebilir). Geliştirme sunucusu (3100) ile çakışmaz. Mevcut sunucuyu kullanmak için: `PLAYWRIGHT_REUSE_SERVER=1 ROOMIO_URL=http://127.0.0.1:3100 npm run test:e2e`.

`e2e/warm-routes.setup.ts` kritik API rotalarını testlerden önce derler (dev modda ilk istek 404 flakiness önlenir).

## 3. Güvenlik

- [ ] Demo kullanıcı şifreleri production DB'de değiştirildi veya devre dışı
- [ ] `ROOMIO_DEMO_AUTH=0` (production)
- [ ] HTTPS zorunlu (reverse proxy / Render / Fly TLS)
- [ ] `httpOnly` cookie (`roomio-token`) — varsayılan middleware ile uyumlu

### API erişimi (`ROOMIO_AUTH_REQUIRED=1`)

Sayfa rotaları middleware ile korunur; **API rotaları** her istekte JWT ve grup izinlerini ayrı kontrol eder.

| Ortam | Davranış |
|-------|----------|
| `ROOMIO_AUTH_REQUIRED=0` | Middleware tüm sayfalara izin verir; API'ler `resolveApiUser` ile demo kullanıcı (`fo_manager`) kullanır |
| `ROOMIO_AUTH_REQUIRED=1` | Oturum yoksa sayfalar `/login`'e yönlendirilir; API'ler `401` / `403` döner |

**Herkese açık rotalar** (middleware atlar): `/login`, `/offline`, `/wifi`, `/manifest.json`, `/sw.js`, `/icons/*`

**Herkese açık API önekleri:** Oturum veya izin gerektirmez (veya köprü secret ile korunur):

| Rota | Metot | Not |
|------|-------|-----|
| `/api/auth/login` | POST | Giriş |
| `/api/auth/config` | GET | `authRequired` bayrağı |
| `/api/auth/logout` | POST | Oturum kapatma (token varsa iptal) |
| `/api/health` | GET | Uptime / sağlık |
| `/api/locale` | GET | Giriş öncesi i18n |
| `/api/push/vapid-public-key` | GET | Web push anahtarı |
| `/api/compliance/5651/wifi/*` | * | Misafir WiFi portalı |
| `/api/compliance/5651/ingest` | POST | Köprü secret (`x-roomio-bridge-secret`) |
| `/api/compliance/5651/radius/accounting` | POST | Köprü secret |

**Oturum API (`/api/auth/session`):** `SessionProvider` uygulama açılışında çağırır. `GET` — geçerli JWT varsa kullanıcı, izinler ve muhasebe özet verisi (`invoices`, `stock`, `ledger`) döner; `ROOMIO_AUTH_REQUIRED=1` iken token yoksa `401`. `ROOMIO_AUTH_REQUIRED=0` iken token yoksa `?role=` ile demo oturum (varsayılan `fo_manager`). `POST` → `settings.admin` (yönetici placeholder).

**Kimlik API:** `identity/notifications` ve `egm/identity` GET → `identity.read`; POST → `identity.notify`.

**İstemci istekleri:** `roomioFetch` otomatik olarak `Authorization: Bearer <token>` ve `x-roomio-property-id` başlıklarını ekler. Oturum açma: `POST /api/auth/login` → `roomio-token` cookie. Entegrasyon, uyumluluk (5651), muhasebe ve lisans araçları `roomioFetch` kullanır; `SessionProvider` ve herkese açık uçlar (`auth/login`, `auth/config`, `wifi/login`, `vapid-public-key`) ham `fetch` kalır.

**Deploy checklist kimlik bilgisi:** `ROOMIO_CHECKLIST_EMAIL` / `ROOMIO_CHECKLIST_PASSWORD` (varsayılan: `arda@hotelsapphire.com` / `roomio123`). Checklist scripti korumalı endpoint'ler için `authFetch` kullanır.

**Admin checklist:** `ROOMIO_ADMIN_EMAIL` (varsayılan: `admin@roomio.local`) — kullanıcı güncelleme (`POST /api/users`) smoke testi için aynı şifre (`ROOMIO_CHECKLIST_PASSWORD`).

**Viewer demo:** `viewer@hotelsapphire.com` / `roomio123` — salt okunur RBAC testleri (E2E). `reservations.read` ile dashboard, rack, doluluk matrisi; `cash.read` ile kasa defteri, kapanış raporu ve folyo GET; `identity.read` ile kullanıcı listesi ve kimlik API'leri. `cash.write` yok — folyo/depozit POST `403`. Checklist viewer login ile rezervasyon/kullanıcı/HK/check-in yazma reddini doğrular.

**Kimlik okuma — kısmi kuruluş erişimi:** `identity.read` yetkisi olan kullanıcılar `/settings?section=users` ve `/settings?section=user-groups` ekranlarına erişebilir; diğer kuruluş ekranları `settings.admin` gerektirir.

**HK demo:** `hk@hotelsapphire.com` / `roomio123` — HK E2E (`reservations.read`, `hk.manage`; `cash.read` yok — kasa/folyo `403`). Checklist HK login ile rezervasyon listesi, oda PATCH ve rezervasyon POST `403` doğrular. `/housekeeping` rotaları `hk.manage` gerektirir.

**Muhasebe demo:** `muhasebe@hotelsapphire.com` / `roomio123` — accounting E2E ve checklist (`/api/accounting/ledger` GET/POST, `cash.read` ile kasa defteri; rezervasyon POST `403`).

**Resepsiyon demo:** `reception@hotelsapphire.com` / `roomio123` — resepsiyon E2E (`reservations.read`/`write`, `reception.checkin`, `cash.read`/`write`; dashboard, rack, kasa, folyo; muhasebe check-in `403`).

**HK API:** `GET /api/housekeeping/rooms` ve `GET|POST /api/hk/routes` → `hk.manage` gerekir.

**Resepsiyon API:** `GET /api/reception/room-suggest` → `reception.checkin`; `POST /api/reception/check-in` → `reception.checkin`; `POST /api/reception/checkout` → `reception.checkout`.

**Program tarihi API:** `GET /api/business-date` → oturum gerekir; `POST` → `settings.admin`.

**Kuruluş master API:** `GET` → oturum (`requireKurulusApiRead`); `POST` → `settings.admin` (`requireKurulusApiWrite`). Kapsam: `user-params`, `config-params`, `market-required`, `property-*`, `room-type-defs`, `master-codes`, `warehouses`, `fiscal-devices`, `hotel-seasons`, `meal-prices`, `property-languages`, `extra-charges`, `agencies`, `companies`, `rate-plans`, `property-inventory`.

**Entegrasyon API:** `integrations/status` GET → oturum (`requireIntegrationAdminRead`). Ayarlar `GET` → oturum; `POST` → `settings.admin` (`integrations/*/config`, `compliance/5651/config|logs|devices|automation|bridge/test|export|guest-session`). Operasyonel: `tesa/encode` POST ve `pbx/checkin` → `reception.checkin`; `tesa/checkout` ve `pbx/checkout` → `reception.checkout`. `integrations/egm/test` GET → `identity.read` veya `settings.admin`. Webhook (`5651/ingest`, `5651/radius/accounting` POST) köprü secret ile kalır; `5651/wifi/login` herkese açık.

**Döviz / vergi API:** `exchange-rates` GET → oturum; `exchange-rates/archive` POST → `settings.admin`. `exchange/config` ve `tax/rules` → kuruluş master kalıbı. `fx-exchanges` GET → `cash.read`; POST → `cash.write`. `locale` GET → herkese açık (giriş öncesi i18n).

**Rapor / operasyon API:** `reports/export`, `reports/export-template`, `reports/consolidated`, `reports/suggest` POST → `reports.export`. `reports/templates` GET → oturum; POST/DELETE → `reports.export`; `templates/share` POST → `settings.admin`. `operations/summary` GET → oturum. `monitoring/sla` GET → oturum; `monitoring/status` GET → `settings.admin`.

**Sync / push API:** `sync/push` POST ve `sync/pull` GET → `hk.manage`. `push/subscribe` GET/POST ve `push/send` POST → `hk.manage`; `push/presence` POST → oturum. `push/vapid-public-key` GET → herkese açık.

**Genel API:** `properties` GET → oturum. `weather` GET → oturum. `operations/summary` GET → oturum. `audit` GET → `eod.close` veya `reports.export`. `room-blocks` GET → `reservations.read`; POST/PUT → `reservations.write`. `license/verify` POST → oturum; PUT → `ROOMIO_VENDOR_MODE=1`.

**Misafir ilişkileri API:** `guest-activities`, `guest-reviews`, `guest-complaints`, `guest-traces`, `guests/archive`, `gr-inhouse`, `info-rack`, `facility-bookings`, `reclamations`, `vip-guests`, `lost-found`, `repeat-guests` GET → `identity.read`; POST → `identity.notify` (`repeat-guests` yalnızca GET). `fnb/banket` GET → oturum; POST → `reservations.write`.

**Kasa / folyo / EOD API:** `folio` ve `cash` GET → `cash.read`; POST → `cash.write`. `deposits` GET → `cash.read`; POST/PATCH → `cash.write`. `eod/pre-close`, `eod/close` GET, `eod/night-posting` POST, `eod/night-audit-package` GET/POST → `eod.close`.

**Muhasebe / envanter / HK API:** `accounting/ledger` ve `accounting/invoices` GET → `accounting.read`; yazma → `accounting.write`. `inventory/stock` GET → `accounting.read`; POST → `accounting.write`. `housekeeping/rooms`, `housekeeping/faults` → `hk.manage`. `housekeeping/requests` GET → `hk.manage` veya `reception.checkin`; POST → `reception.checkin`; PATCH → `hk.manage`.

**Çekirdek operasyon API:** `dashboard`, `rack`, `reservations`, `reservations/groups` GET → `reservations.read` (grup pickup PDF → `reports.export`); grup yazma → `reservations.write`. `reservations/availability` GET → `reservations.read`. `reception/check-in` POST → `reception.checkin`; `reception/checkout` POST → `reception.checkout`. `cash` tüm görünümler (ledger, close-report, registers) GET → `cash.read`; POST → `cash.write`.

**Route erişimi:** `RouteAccessGuard` (AppShell) `canAccessRoute` ile `/settings` kısmi erişim, `/housekeeping` → `hk.manage`, `/accounting` → `accounting.read` uygular.

**Örnek izinler:** `reservations.read` (rezervasyon listesi, dashboard, rack, doluluk matrisi), `folio.read` / `folio.write`, `cash.read`, `identity.read` / `identity.notify`, `settings.admin` (kullanıcı/grup yazma, kullanıcı listesi POST), `reservations.write`.

### Auth audit özeti (batch 49–65)

| Batch | Değişiklik |
|-------|------------|
| 64 | `roles.ts` circular import düzeltmesi; `init()` reentrant deadlock (`AsyncLocalStorage`) |
| 65 | E2E route warm setup; muhasebe folyo / resepsiyon TESA test düzeltmeleri |
| 66 | `verify:all` genişletildi — entegrasyon, çoklu şube, i18n, roomio E2E |
| 67 | `test:routes` verify zincirine eklendi; `verify:ui` rollout scripti; pdfkit external fix |
| 68 | `verify:quick`; `VERIFY_BUILD=1`; E2E retry |
| 69 | `verify:pipeline` — otomatik zincir (API → UI → prod build) |
| 70 | Pipeline 7 aşama (auth-required, tam rollout, docker, canlı URL); middleware API `401`; `verify:auth` E2E |


| Katman | Kural |
|--------|-------|
| Middleware | Sayfa → `/login` yönlendirme; **API** → `401` JSON (redirect yok) |
| `requireApiAuth` | Oturum zorunlu (`401`) |
| `requireApiPermission` | Oturum + tek izin (`403`) |
| `requireKurulusApiRead` / `Write` | Kuruluş master GET oturum / POST `settings.admin` |
| `requireIntegrationAdminRead` / `Write` | Entegrasyon GET oturum / POST `settings.admin` |
| Köprü webhook | `x-roomio-bridge-secret` — JWT yok |

**Production checklist — auth'suz `401` smoke:** `exchange-rates`, `properties`, `dashboard`, `rack`, `reservations`, `reservations/availability`, `folio`, `cash`, `deposits`, `5651/export`, `integrations/status`.

**Rol E2E matrisi:** `e2e/api-protected.spec.ts` — viewer (salt okunur + yazma reddi), HK, muhasebe, resepsiyon; `e2e/folio-cash.spec.ts` — folyo iş akışı; `e2e/auth-required.spec.ts` — production auth modu (`verify:auth`).

**İstemci:** Korumalı API çağrıları `roomioFetch`; auth/compliance public uçlar ve `SessionProvider` ham `fetch`.

## 4. Sağlık ve izleme

- [ ] `GET /api/health` → `200`, `ok: true`, `checks.auth.ok: true`
- [ ] Uptime izleme: `/api/health` (ör. UptimeRobot) — `npm run go-live:verify`
- [ ] Sentry release etiketi (`public/release-manifest.json` postbuild)

## 5. Kritik rotalar (200 veya beklenen auth yönlendirmesi)

| Rota | Beklenen |
|------|----------|
| `/` | 200 veya `/login` |
| `/login` | 200 |
| `/api/health` | 200 |
| `/api/properties` | 200 (auth ile) |
| `/api/dashboard` | 200 (auth + `reservations.read`) |
| `/api/rack` | 200 (auth + `reservations.read`) |
| `/offline` | 200 (PWA) |
| `/manifest.json` | 200 |

## 6. Performans

- [ ] Dashboard / rack API `Cache-Control` başlıkları aktif
- [ ] Sunucu bellek: health `memoryMb` makul (<512 MB tek konteyner)
- [ ] Soğuk başlangıç <8s, sıcak health <3s (`deploy:checklist` ölçer)

## 7. PWA / mobil HK

- [ ] `public/sw.js` sürümü güncel (deploy sonrası hard refresh)
- [ ] `/offline` sayfası erişilebilir
- [ ] Push VAPID anahtarları production secret'larda

## 8. Çoklu şube

- [ ] Her şube `x-roomio-property` / `x-roomio-property-id` ile test edildi
- [ ] Konsolide rapor PDF (`/api/reports/consolidated?format=pdf`)

## 9. Go-live komutları

```bash
# Render
npm run render:go-live

# Fly
npm run deploy:fly:live

# Canlı doğrulama
ROOMIO_PUBLIC_URL=https://your-domain npm run deploy:checklist
```

## 10. Rollback

- Önceki Docker imajı / Render deploy geçmişi
- `DATABASE_URL` yedek (pg_dump)
- `fly releases` veya Render manual rollback

---

**Son güncelleme:** init reentrant fix, E2E route warm, JWT auth, PWA offline, folio charge API.
