# Roomio PMS

Modern otel yönetim sistemi — **Mac** ve **Windows** üzerinde Next.js ile çalışır. Elektra (Konak) menü yapısı referans alınmış bağımsız kod tabanıdır.

## Gereksinimler

- Node.js 20+ ([nodejs.org](https://nodejs.org))
- npm (Node ile birlikte gelir)

## Kurulum

```bash
cd ~/Projects/roomio-pms
npm install
npm run serve          # production build + başlat (port 3100)
# veya geliştirme:
npm run dev            # otomatik port + hot reload
```

Tarayıcı: **http://127.0.0.1:3100** (aktif port `.roomio/runtime/active-port.txt`)

Ayrıntılı komutlar: **[HELP.md](./HELP.md)** · Yol haritası: **[references/NEXT-PHASE.md](./references/NEXT-PHASE.md)**

## Modül durumu

| Modül | Durum |
|--------|--------|
| Panel / Ana sayfa | Güçlü — KPI, sürükle-bırak dashboard, oda rack |
| Rezervasyon | Güçlü — liste, yeni kayıt, grafik takvim, import |
| Resepsiyon | Güçlü — giriş/çıkış, konaklayan, kimlik (EGM) |
| Ön kasa / Folyo | Güçlü — kasa defteri, tahsilat, döviz, depozit |
| Kat hizmetleri | Güçlü — oda kontrolü, görevler, mobil push |
| Misafir ilişkileri | Güçlü — trace, şikayet, VIP, yorumlar |
| Banket / F&B | Orta — hub, katalog, POS iskeleti |
| Arka büro | İyi — fatura, cari, stok |
| Raporlar / Gün sonu | Güçlü — kategori raporları, EOD, export |
| Kuruluş / Sistem | İyi — 40+ tanım ekranı, entegrasyon merkezi |
| Entegrasyonlar | Geniş — 30+ modül (simülasyon + canlı mod) |
| Auth / Kurulum | Güçlü — JWT, RBAC, ilk kurulum sihirbazı |

**Devam eden:** Faz 15 — Render deploy, HTTPS push, opsiyonel Postgres, sahada EGM gateway.

## Test

```bash
npm run typecheck          # TypeScript
npm run lint               # ESLint
npm run build:safe         # Güvenilir production build (Node 20, temiz .next)
npm run test:routes        # 240+ rota smoke test
npm run test:core-flow     # Rezervasyon → check-in → folyo → check-out
npm run test:unit          # Birim testleri
npm run verify:auth        # ROOMIO_AUTH_REQUIRED=1 JWT smoke
npm run test:e2e           # Playwright (36 spec)
npm run verify:ci          # CI pipeline (typecheck + build + smoke)
```

İlk kurulum (boş veritabanı): `/setup` veya demo seed (`roomio123`).

## Ortam değişkenleri

`.env.example` dosyasına bakın. Production için:

```bash
ROOMIO_AUTH_REQUIRED=1
ROOMIO_DEMO_AUTH=0
ROOMIO_JWT_SECRET=<güçlü-secret>
```

Production build için **Node 20** önerilir (`npm run build:safe` otomatik kullanır).

## Proje yapısı

```
roomio-pms/
├── app/              # Sayfalar ve API (App Router)
├── components/       # UI, hub panelleri, modül ekranları
├── lib/              # auth, data, integrations, server
├── prisma/           # SQLite (dev) + PostgreSQL (prod) şemaları
├── e2e/              # Playwright testleri
└── scripts/          # smoke test, deploy, verify
```
