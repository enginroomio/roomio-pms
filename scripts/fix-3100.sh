#!/bin/bash
# Eski sunucuları kapatır, yeni build ile temiz portta başlatır.
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
HOST="${ROOMIO_HOST:-127.0.0.1}"
PREFERRED="${ROOMIO_PORT:-3100}"

echo ""
echo "════════════════════════════════════════"
echo "  Roomio — sunucuyu düzelt"
echo "════════════════════════════════════════"
echo ""

echo "→ Eski süreçler kapatılıyor (${PREFERRED}–3200)…"
node scripts/roomio-kill-ports.mjs || true
sleep 1

pick_port() {
  local p
  for p in $(seq "$PREFERRED" $((PREFERRED + 60))); do
    if ! lsof -ti:"$p" >/dev/null 2>&1; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

PORT="$(pick_port)" || { echo "HATA: Boş port bulunamadı."; exit 1; }

if [ "$PORT" != "$PREFERRED" ]; then
  echo "→ ${PREFERRED} meşgul — ${PORT} kullanılacak"
fi

echo "→ Build alınıyor…"
npm run build

mkdir -p .roomio/runtime
echo "$PORT" > .roomio/runtime/active-port.txt

echo "→ Sunucu başlatılıyor → http://${HOST}:${PORT}/"
npx next start -H "$HOST" -p "$PORT" &
SERVER_PID=$!
sleep 4

if ! curl -sf "http://${HOST}:${PORT}/api/health" >/dev/null; then
  echo "HATA: Sunucu yanıt vermedi."
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi

CSS=$(curl -s "http://${HOST}:${PORT}/" | grep -o '_next/static/css/[^"]*' | head -1)
CSS_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://${HOST}:${PORT}/${CSS}")
if [ "$CSS_CODE" != "200" ]; then
  echo "HATA: CSS yüklenemedi (${CSS} → ${CSS_CODE})."
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi

open "http://${HOST}:${PORT}/" 2>/dev/null || true
echo ""
echo "✓ Hazır: http://${HOST}:${PORT}/"
echo "  CSS OK · Oda Rack: Tüm rack (F12) | 1. Kat … 5. Kat"
if [ "$PORT" != "$PREFERRED" ]; then
  echo ""
  echo "  Not: http://${HOST}:${PREFERRED}/ eski/hatalı — ${PORT} kullanın."
fi
echo ""
