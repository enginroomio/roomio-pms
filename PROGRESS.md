# Roomio — Geliştirme Durumu

Son güncelleme: 2026-06-19

## Donmadığımı nasıl görürsün?

1. **Terminal:** `cd ~/Projects/roomio-pms && npm run dev` → http://127.0.0.1:3100 açılmalı
2. **Smoke test:** `npm run test:routes` → tüm rotalar ✓
3. **Build:** `npm run build` → hatasız bitmeli
4. **Bu dosya:** Her faz sonrası güncellenir

## Fazlar

- [x] **Faz 1** — App shell, teal sidebar, ana sayfa KPI + rack önizleme
- [x] **Faz 2** — Rezervasyon listesi, filtre, yeni form, detay sayfası
- [x] **Faz 3** — Resepsiyon: konaklayanlar, giriş/çıkış, boş odalar, check-in, folyo
- [x] **Faz 4** — Kat hizmetleri: oda durumu, görevler
- [x] **Altyapı** — Çevrimdışı IndexedDB, şifreli senkron, KVKK denetim günlüğü
- [x] **Lisans** — RSA-4096 imzalı lisans üretici + doğrulama
- [x] **TESA** — Hospitality 7.04.03 HT24 PMS Service entegrasyonu
- [x] **Faz 5** — Misafir ilişkileri (14 menü, kısayollar, raporlar)
- [ ] **Faz 6** — Yiyecek & İçecek

## Mac & Windows

Aynı komutlar her iki işletim sisteminde çalışır (Node.js 20+).
