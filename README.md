# Roomio PMS

Modern otel yönetim sistemi — **MacBook** ve **Windows** üzerinde Next.js ile çalışır.

## Gereksinimler

- Node.js 20+ ([nodejs.org](https://nodejs.org))
- npm (Node ile birlikte gelir)

## Kurulum (Mac & Windows)

```bash
cd ~/Projects/roomio-pms   # Windows: cd C:\Users\...\Projects\roomio-pms
npm install
npm run serve
```

Tarayıcı: **http://127.0.0.1:3100**

Ayrıntılı çalıştırma, port temizliği ve servis komutları için **[HELP.md](./HELP.md)** dosyasına bakın.

Ekran rollout sırası ve sonraki faz planı: **[references/NEXT-PHASE.md](./references/NEXT-PHASE.md)** · **[references/SCREEN-REFERENCE.md](./references/SCREEN-REFERENCE.md)**

## Test

```bash
npm run typecheck   # TypeScript kontrolü
npm run build       # Production derlemesi
```

## Geliştirme planı (bölüm bölüm)

| Faz | Modül | Durum |
|-----|--------|--------|
| 1 | Shell + Ana Sayfa (teal sidebar) | ✅ |
| 2 | Rezervasyon (liste, yeni, detay) | ✅ |
| 3 | Resepsiyon (konaklayan, check-in/out, folyo) | ✅ |
| 4 | Kat Hizmetleri | Sırada |
| 5+ | Diğer modüller | Bekliyor |

## Proje yapısı

```
roomio-pms/
├── app/              # Sayfalar (Next.js App Router)
├── components/       # AppShell, PageHeader
├── lib/              # navigation, theme
└── package.json
```

Konak PMS (Elektra) menü haritası referans alınır; Roomio bağımsız yeni kod tabanıdır.
