# Roomio PMS — Çalıştırma Kılavuzu

Bu dosya uygulamayı hızlı ve hatasız çalıştırmak için önerilen yöntemleri açıklar. Komutlar **macOS/Linux (Terminal)** ve **Windows (PowerShell veya CMD)** için ayrı ayrı verilmiştir; aksi belirtilmedikçe `npm run ...` komutları her iki platformda da aynıdır.

## Gereksinimler

- Node.js 20+ ([nodejs.org](https://nodejs.org))
- npm (Node ile birlikte gelir)
- Windows'ta ek bir araç (WSL, Git Bash vb.) **gerekmez** — tüm `npm run` komutları platform bağımsız Node.js script'leridir.

İlk kurulum:

**macOS / Linux:**
```bash
cd ~/Projects/roomio-pms
npm install
```

**Windows (PowerShell):**
```powershell
cd $HOME\Projects\roomio-pms
npm install
```

---

## Önerilen: Production modu (hızlı ve kararlı)

```bash
npm run up
```

Bu komut eski süreçleri kapatır, build alır ve sunucuyu başlatır (her iki platformda aynı komut). Terminalde yazan URL'yi açın (genelde **http://127.0.0.1:3100**).

Alternatif:

```bash
npm run serve
```

Tarayıcı: **http://127.0.0.1:3100**

### "Web'e ulaşamıyorum" / sayfa "Yükleniyor"da kalıyor

**Sebep:** Port **3100**'de eski, takılı bir `node` süreci var. Tarayıcı bağlanır ama yanıt gelmez → sekme sürekli "Yükleniyor" yazar.

**Çözüm (her iki platformda aynı komutlar):**

```bash
npm run kill
npm run up
```

Terminalde yazan adresi açın. Hızlı test:

**macOS / Linux:**
```bash
curl -s --max-time 2 http://127.0.0.1:3100/api/health
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:3100/api/health -TimeoutSec 2
```

`{"ok":true,...}` dönmeli. Dönmezse port hâlâ takılıdır:

**macOS / Linux:**
```bash
lsof -ti:3100 | xargs kill -9
npm run up
```

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run up
```

Şu an çalışan sunucu varsa geçici olarak: **http://127.0.0.1:3123**

`localhost` yerine **127.0.0.1** kullanın.

---

## Geliştirme modu

Kod değiştirirken:

```bash
npm run dev
```

`npm run dev` varsayılan olarak **polling** kullanır (`WATCHPACK_POLLING=true`). macOS'ta `EMFILE: too many open files` hatasını ve sayfa 404 sorunlarını önler. Windows'ta dosya izleme zaten farklı bir mekanizma (ReadDirectoryChangesW) kullandığından bu sorun görülmez, ama aynı komut sorunsuz çalışır.

Klasik dosya izleyici istiyorsanız (sistem limiti yeterliyse):

```bash
npm run dev:watch
```

---

## Eski sunucuları kapatma

Birden fazla `next dev` veya `next start` süreci aynı anda çalışırsa port çakışması ve yavaşlık oluşur. En basit yol her iki platformda da:

```bash
npm run kill
```

Manuel olarak belirli portları kapatmak isterseniz:

**macOS / Linux:**
```bash
lsof -ti:3100,3119,3120,3121,3122 | xargs kill 2>/dev/null
npm run serve
```

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run serve
```

---

## Diğer npm komutları

| Komut | Açıklama |
|-------|----------|
| `npm run build` | Production derlemesi |
| `npm run start` | Derlenmiş uygulamayı başlatır (önce `build` gerekir) |
| `npm run serve` | `build` + `start` (önerilen) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run test:routes` | Temel rota smoke testi (`ROOMIO_URL` ile) |
| `npm run test:e2e` | Playwright E2E testleri |
| `npm run db:push` | Prisma şema → SQLite DB |
| `npm run db:seed` | Demo veri seed |
| `npm run bridge:syslog` | MikroTik/UniFi syslog köprüsü |
| `npm run automation:hotspot` | 5651 otomasyon döngüsü (ayrı süreç) |
| `npm run services` | Next.js + syslog köprü + otomasyon birlikte |

### Syslog köprüsü

```bash
ROOMIO_URL=http://127.0.0.1:3100 \
ROOMIO_BRIDGE_SECRET=roomio-bridge-dev \
npm run bridge:syslog
```

### Tüm arka plan servisleri

Önce uygulamanın çalıştığından emin olun (`npm run serve`), sonra ayrı terminalde:

```bash
npm run services
```

---

## Performans notları

- **Yavaşlık veya 404:** Genelde eski `next dev` süreci veya EMFILE kaynaklıdır. `npm run serve` kullanın veya `npm run dev` (polling) ile yeniden başlatın.
- **Açılış:** Senkron ve yerel veritabanı seed işlemi UI’ı bloklamamak için birkaç saniye ertelenir.
- **5651 otomasyonu:** Geliştirme modunda sunucu tarafı otomasyon varsayılan olarak kapalıdır. Production’da (`npm run start` / `npm run serve`) arka planda çalışır.
- Geliştirmede otomasyonu zorla açmak için: `ROOMIO_AUTOMATION=1 npm run start`

---

## Smoke test

Sunucu çalışırken:

```bash
ROOMIO_URL=http://127.0.0.1:3100 npm run test:routes
```

---

## Demo bilgileri

- **Otel:** Hotel Sapphire İstanbul
- **JWT giriş:** arda@hotelsapphire.com / `roomio123` (header → JWT butonu)
- **Veritabanı:** `.roomio-data/roomio.db` (Prisma SQLite)
- **WiFi portalı:** http://127.0.0.1:3100/wifi
- **Demo WiFi:** oda `412` / şifre `R412{year}`, oda `305` / şifre `R305{year}`
- **5651 ayarları:** `/settings/compliance/5651`
- **TESA:** `/settings/integrations/tesa`
