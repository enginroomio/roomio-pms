# Roomio PMS — Sektör Parity & Eksik Analizi

> Son güncelleme: **2026-06-24**  
> Referanslar: Konak PMS (Elektra v5), Opera/Cloudbeds/Mews özellik setleri, `konak-pms/references/ELEKTRA-SCREEN-REFERENCE.md`

---

## Bu oturumda tamamlananlar

| Alan | Değişiklik |
|------|------------|
| **Verify pipeline** | 7 aşamalı otomatik zincir — `npm run verify:pipeline` |
| **Auth-required** | `verify:auth` + middleware API `401`; `e2e/auth-required.spec.ts` |
| **Tam rollout** | `verify:rollout` — 10× `rollout-*.spec.ts` |
| **Pipeline fix** | `VERIFY_KEEP_SERVER=1` artık sonraki aşamaya geçişi bloklamıyor |
| **Ana ekran sağ tık** | Elektra v5 — 11 grup, tüm alt menüler |
| **Folio + Kasa** | Prisma + `/api/folio`, `/api/cash` + E2E |
| **Çoklu şube canlı** | Portföy şeridi + hook yenileme + E2E |
| **PDF şablonları (batch 71)** | `pdf-theme.ts`, fatura PDF API/UI, konsolide kartlar, gece denetim tema, `e2e/pdf-templates.spec.ts` |
| **i18n muhasebe** | EN/TR anahtarları + `AccountingPageClient` + E2E |
| **PWA offline shell** | SW v11 shell genişletme + offline kısayol navigasyonu |
| **GR trace & review CRUD** | Düzenle/tamamla/sil + cevapla/sil + `guest-relations-traces-reviews` E2E |
| **Banket→folyo** | `postBanketEventToFolioServer` + UI + `fnb-banket-folio` E2E |
| **Hızlı POS→folyo** | `/api/folio` charge + `FnbQuickPosPanel` + `fnb-pos-folio` E2E |
| **Kuruluş i18n** | `HotelInfo`, `FiscalDevices`, `MasterCodes` + kuruluş/F&B i18n E2E |
| **Kuruluş nav i18n** | `kurulus-nav-i18n.ts` + `SettingsPageClient` yan menü + aktif ekran etiketi |
| **Şirket / acenta i18n** | `CompaniesSettingsPanel`, `AgenciesSettingsPanel` + i18n E2E |
| **MasterCodes + vergi i18n** | `titleKey` kolon anahtarları, `TaxRulesPanel`, demo-data/şirket toolbar |
| **Sidebar kuruluş flyout** | `i18nKey` + `translateSidebarNavItems` — Kuruluş alt menüsü EN |
| **Sidebar pro modül i18n** | Modül sekmeleri, hızlı aksiyonlar, sistem üst menü, `PRO_ESSENTIAL_IDS` |
| **ExchangeConfigPanel i18n** | Kur bozdurma ayarı TR/EN |
| **Offline trace kuyruğu** | `guest_trace` sync push + `submitGuestTrace` + E2E |
| **Rapor alt menü i18n** | `REPORT_SAMPLES` id + `sidebar.report.*` anahtarları (9 kategori × 4 örnek) |
| **Sağ tık ana menü i18n** | `ElektraMainContextMenu` + `sidebar.ctx.*` grup etiketleri |
| **Dashboard hareketler i18n** | `DailyMovements` + `dashboard.movements.*` |

---

## Elektra v5 parity özeti

| Modül | Roomio | Konak | Not |
|-------|--------|-------|-----|
| Kabuk & menü | ✅ | ✅ | TopMenu + sağ tık tam menü |
| Oda Rack F12 | ✅ | ✅ | Canlı rezervasyon + HK |
| Rezervasyon | ✅ | ✅ | Liste, yeni, forecast F1 |
| Resepsiyon | ✅ | ✅ | Check-in/out API |
| Ön Kasa | ✅ | ✅ | Folio + kasa Prisma + PDF kapanış |
| Kat HK | ✅ | ✅ | Mobil + operations |
| Misafir İlişkileri | ✅ | ✅ | Şikayet, VIP, trace, review, kayıp/buluntu, reklamasyon CRUD + E2E |
| Banket / F&B | ✅ | 🟡 | Banket + hızlı POS → folyo canlı |
| Arka Büro | ✅ | ✅ | Kuruluş tabloları + geniş i18n (oda tip, kat, sezon, rate plan, şube, depo, kullanıcı) |
| Raporlar | ✅ | ✅ | 12 kategori export |
| Gün Sonu | ✅ | ✅ | Kapatma + arşiv |
| Entegrasyonlar | ✅ | 🟡 | 5651, TESA, PBX (Roomio güçlü) |

**Tamamlanma:** ~100% canlı, ~0% kısmi, ~0% planlı

---

## Hâlâ eksik (öncelik sırası)

### Yüksek
1. ~~**Folio / folio satırları**~~ — ✅
2. ~~**Kasa defteri**~~ — ✅
3. ~~**JWT oturum**~~ — ✅ API + login; dev'de demo rol seçici
4. ~~**Rack grid**~~ — ✅ sunucu snapshot

### Orta
5. ~~Muhasebe fatura/cari tam CRUD~~ — ✅ fatura kes/tahsil/düzenle + cari defter CRUD + `e2e/accounting-crud.spec.ts`
6. ~~Çoklu şube canlı veri~~ — ✅ şube header + portföy şeridi + hook yenileme + `multiproperty-live` E2E
7. ~~Gelişmiş PDF şablonları~~ — ✅ `pdf-theme.ts`, fatura PDF, konsolide kartlar, gece denetim tema + `e2e/pdf-templates.spec.ts`

### Düşük
8. i18n çeviri motoru — ✅ kuruluş + sidebar flyout + rapor alt örnekleri + sağ tık menü + dashboard hareketler
9. PWA offline shell — ✅ misafir talebi + HK durum + trace create/complete/delete sync + E2E
10. ~~Yazarkasa (fiscal)~~ — ✅ canlı cihaz paneli + status/ping API + E2E
11. ~~Misafir İlişkileri CRM~~ — ✅ şikayet + VIP + trace + review CRUD + E2E
12. ~~Banket→folyo~~ — ✅ `postBanketEventToFolioServer` + UI + `fnb-banket-folio` E2E
13. ~~Hızlı POS→folyo~~ — ✅ `/api/folio` charge + `FnbQuickPosPanel` + `fnb-pos-folio` E2E

---

## Test komutları

```bash
npm run verify          # hızlı CI (API + auth, ~7 dk) — varsayılan doğrulama
npm run verify:ci       # aynı
npm run verify:pipeline # tam 7 aşama
npm run setup:auto      # kurulum + verify:ci otomatik zincir
```

**Sağ tık menü testi:** Ana sayfa boş alanda sağ tık → Sistem, Rezervasyon, … Ayarlar grupları görünmeli.

---

## Dosya haritası (doğrulama)

| Dosya | Amaç |
|-------|------|
| `scripts/verify-pipeline.mjs` | 7 aşamalı otomatik zincir |
| `scripts/verify-all.mjs` | API tam doğrulama |
| `scripts/verify-auth-required.mjs` | Production auth smoke |
| `scripts/verify-rollout.mjs` | Tüm rollout E2E |
| `e2e/auth-required.spec.ts` | Auth 401/403 matrisi |
| `references/VERIFY-PIPELINE.md` | Pipeline dokümantasyonu |
| `middleware.ts` | Sayfa redirect; API `401` |
