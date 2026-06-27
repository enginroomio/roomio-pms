# Roomio — Ekran Referans Kataloğu

> **402 generated mockup** — kaynak klasör bağlandı.  
> Her oturum sonunda **`NEXT-PHASE.md`** güncellenir.

Son güncelleme: **2026-06-19**

---

## Görüntü kaynağı

| Alan | Yol |
|------|-----|
| **Ana klasör** | `/Users/Engin/.cursor/projects/empty-window/assets/` |
| **Projede symlink** | `references/assets` → yukarıdaki klasör |
| **Web erişimi** | `http://127.0.0.1:3100/mockups/screen-039-rezervasyon-listesi.png` |
| **Katalog JSON** | `references/screen-catalog.json` + `public/screen-catalog.json` |
| **Kuyruk meta** | `references/screen-queue.json` |

Katalog yenileme:

```bash
npm run catalog:screens
```

---

## Çalışma yöntemi

1. `/tools/rollout?phase=…` → mockup önizlemesi + canlı sayfa karşılaştırması
2. Adımı test et → **İşaretle**
3. Oturum sonunda `NEXT-PHASE.md` planını uygula

---

## Ekran aralıkları (402 adet)

| Aralık | İçerik |
|--------|--------|
| `screen-000` | Ana ekran / room rack |
| `screen-001` … `037` | Sistem › Kuruluş, rapor, servis, dil |
| `screen-038` … `059` | Rezervasyon |
| `screen-060` … `084` | Resepsiyon |
| `screen-085` … `100` | Ön Kasa |
| `screen-101` … `117` | Kat HK |
| `screen-118` … `131` | Misafir İlişkileri |
| `screen-132` … `145` | Banket |
| `screen-146` … `188` | ArkaBüro |
| `screen-189` … `198` | Gün Sonu |
| `screen-199` … `246` | Raporlar |
| `screen-247` … `401` | Roomio modern UI (teal) |
| `roomio-final-*` | Seçilmiş ana sayfa tasarımları |

---

## Faz → mockup eşlemesi

Rollout adımları `lib/navigation/rollout-phases.ts` içinde `mockupFile` alanıyla bağlıdır.

Örnekler:
- Faz 3 Rezervasyon listesi → `screen-039-rezervasyon-listesi.png`
- Faz 3 Yeni kayıt → `screen-038-rezervasyon-yeni-kayit.png`
- Faz 3 Hızlı blokaj → `screen-050-rezervasyon-hizli-blokaj.png`
- Ana sayfa (final) → `roomio-final-ana-sayfa-rack.png`

---

## Roomio UI alternatifleri

`roomio-ana-sayfa-arda-v*.png`, `roomio-alt-*.png` — sidebar/topnav varyantları.  
Üretim hedefi: **v6 filled top** + **final rack** kombinasyonu.
