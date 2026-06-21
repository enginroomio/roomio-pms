#!/bin/bash
set -euo pipefail

ROOMIO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$ROOMIO_ROOT"

echo "════════════════════════════════════════"
echo "  Roomio — Chrome hatası düzeltme"
echo "════════════════════════════════════════"
echo ""
echo "Port 3100'daki eski sunucu kapatılıyor…"

for p in $(lsof -ti:3100 2>/dev/null); do
  kill -9 "$p" 2>/dev/null && echo "  Kapatıldı PID $p" || echo "  PID $p kapatılamadı — Activity Monitor'dan 'node' sürecini sonlandırın"
done

sleep 1

if lsof -iTCP:3100 -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo "Port 3100 hâlâ meşgul. Roomio alternatif portta başlayacak."
fi

echo ""
echo "Çalışan sunucu aranıyor / gerekirse yeniden başlatılıyor…"
node scripts/roomio-restart.mjs || true

echo ""
echo "Chrome açılıyor…"
node scripts/roomio-open.mjs
