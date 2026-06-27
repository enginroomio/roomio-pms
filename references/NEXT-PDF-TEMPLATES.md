# Sıradaki batch — Gelişmiş PDF şablonları

> **Durum:** ✅ Uygulandı (batch 71, 2026-06-24)

## Hedef

Opera/Elektra tarzı markalı PDF çıktıları — logo, tablo zebra, sayfa altlığı, çoklu dil başlık.

## Mevcut altyapı

| Dosya | Durum |
|-------|--------|
| `lib/server/pdf-templates.ts` | Konsolide + kasa kapanış PDF (pdfkit) |
| `GET /api/reports/consolidated?format=pdf` | Çalışıyor |
| `GET /api/cash?view=close-report&format=pdf` | Çalışıyor |
| `next.config.ts` | `serverExternalPackages: pdfkit, fontkit` |

## Uygulama planı

1. **Ortak PDF tema** — `buildPdfTheme(propertyId)` → logo URL, renk bandı, font
2. **Fatura PDF** — `GET /api/accounting/invoices?id=&format=pdf`
3. **Gece denetim paketi** — mevcut night-audit PDF’e tema uygula
4. **Şube başlığı** — konsolide PDF’de her tesis satırı + toplam sayfası
5. **E2E** — `e2e/pdf-templates.spec.ts` (content-type + boyut smoke)
6. **verify:all** — PDF suite ekle

## Doğrulama

```bash
npm run verify:ci
# ardından manuel:
curl -H "Authorization: Bearer …" "http://127.0.0.1:3100/api/reports/consolidated?format=pdf" -o /tmp/c.pdf
```

## Bağımlılıklar

- `ROOMIO_PUBLIC_URL` veya property profile’da logo URL
- Muhasebe fatura CRUD ✅ (batch 70)
