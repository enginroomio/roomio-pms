# Roomio PMS — Proje Denetim Raporu

> Son güncelleme: **2026-06-19**  
> Kaynak: `rollout-phases.ts`, `SCREEN-REFERENCE.md`, kod tabanı taraması

> ⚠️ **Bu rapor eski.** "Hâlâ yapılacaklar" bölümündeki PostgreSQL/Prisma,
> JWT ve çoklu şube/RBAC maddeleri artık tamamlandı — güncel durum için
> `references/PARITY-GAP-REPORT.md`'ye bakın (2026-06-24+, bu dosyadan
> daha güncel tutulan denetim raporu).

---

## Özet

| Metrik | Değer |
|--------|-------|
| Rollout fazları | 10 (0–9) |
| Rollout adımları | 44 |
| `page.tsx` sayısı | 44+ |
| API rotaları | 21 |
| Mockup indeksi | 443 görüntü |
| TypeScript | `npm run typecheck` ✓ |

**Genel durum:** Kabuk, ana sayfa, resepsiyon, kat HK, entegrasyonlar (5651/TESA/WiFi) **tamam**. Rezervasyon, ön kasa, raporlar ve gün sonu **bu oturumda güçlendirildi**. ArkaBüro ve bazı menü alt linkleri hâlâ kısmi.

---

## Faz durumu (44 adım)

| Faz | Başlık | Durum | Not |
|-----|--------|-------|-----|
| 0 | Kabuk & Navigasyon | ✅ Tamam | IconRail, TopMenuNav, ShortcutBar |
| 1 | Ana Sayfa & Rack | ✅ Tamam | KPI, rack önizleme, F12 tam rack |
| 2 | Sistem | ✅ Tamam | Kuruluş, rapor hub, TESA, dil |
| 3 | Rezervasyon | ✅ Tamam | Liste, yeni kayıt (localStorage), blokaj sekmesi |
| 4 | Resepsiyon | ✅ Tamam | Giriş/çıkış otomasyonu, info rack, şikayet |
| 5 | Ön Kasa | ✅ Tamam | Kasa defteri, kapatma, döviz, depozit |
| 6 | Kat HK | ✅ Tamam | Oda listesi, görevler, rack |
| 7 | Misafir & Banket | ✅ Tamam | Traces, VIP, yorumlar, banket listesi |
| 8 | Raporlar | ✅ Tamam | PDF/CSV export API |
| 9 | Gün Sonu | ✅ Tamam | Kapatma API + arşiv (sunucu DB) |

---

## Entegrasyonlar (profesyonel modüller)

| Modül | Durum | Dosya / Route |
|-------|-------|----------------|
| **5651 / BTK Hotspot** | ✅ | `lib/integrations/hotspot5651/`, `/settings/compliance/5651` |
| **MikroTik + UniFi** | ✅ | `mikrotik.ts`, `unifi.ts`, cihaz senkron paneli |
| **RADIUS / Syslog köprü** | ✅ | `bridge.ts`, `scripts/hotspot-syslog-bridge.mjs` |
| **WiFi captive portal** | ✅ | `/wifi`, `/api/compliance/5651/wifi/login` |
| **Check-in/out otomasyon** | ✅ | `automation.ts`, reception API'leri |
| **TESA kart** | ✅ | `/settings/integrations/tesa` |
| **Çevrimdışı sync** | ✅ | IndexedDB + `/api/sync/push|pull` |
| **KVKK / şifreleme** | ✅ | `crypto-client.ts`, privacy sayfası |
| **Lisanslama** | ✅ | `/settings/licensing`, `/api/license/verify` |

---

## Bu oturumda tamamlanan eksikler

1. **`/rooms?tab=blocking`** — Hızlı blokaj sekmesi + localStorage
2. **Ön Kasa** — Kasa defteri, kasa kapatma, döviz, depozit tabları
3. **Raporlar** — `action` parametresi, EOD alt ekranları, kategori rapor listeleri
4. **`/fnb`** — Banket rezervasyon + Hızlı POS sekmeleri
5. **Yeni rezervasyon** — `localStorage` ile kalıcı demo kayıt
6. **`npm run test:routes`** — Smoke test scripti
7. **`npm run kill`** — Port temizleme (Yükleniyor sorunu)

---

## Hâlâ yapılacaklar (profesyonel ürün için)

### Yüksek öncelik
- [ ] PostgreSQL / Prisma (şu an `.roomio-data/pms-store.enc`)
- [ ] Gelişmiş PDF şablonları (logo, tablo formatı)
- [ ] JWT oturum (şu an demo RBAC rol seçici)

### Orta öncelik
- [ ] ArkaBüro modülü (fatura, cari, stok — `screen-146`…`188`)
- [ ] Yazarkasa / muhasebe (`/accounting` placeholder)
- [ ] Rapor tasarım editörü (sürükle-bırak değil, en azından alan seçici)
- [ ] Çoklu otel / şube desteği
- [ ] Rol tabanlı yetkilendirme (RBAC)

### Düşük öncelik / polish
- [ ] E2E testler (Playwright)
- [ ] i18n (dil tanımları UI var, çeviri motoru yok)
- [ ] Dark mode
- [ ] PWA / service worker (offline shell)

---

## Test komutları

```bash
cd ~/Projects/roomio-pms
npm run kill
npm run up
# başka terminalde:
ROOMIO_URL=http://127.0.0.1:3100 npm run test:routes
```

Rollout kontrolü: `/tools/rollout` — her faz mockup + canlı sayfa karşılaştırması.

---

## Dosya haritası

| Alan | Yol |
|------|-----|
| Rollout planı | `lib/navigation/rollout-phases.ts` |
| Sonraki faz | `references/NEXT-PHASE.md` |
| Mockup kataloğu | `references/screen-catalog.json` |
| Çalıştırma | `HELP.md` |
| Bu rapor | `references/PROJECT-AUDIT.md` |
