#!/usr/bin/env bash
# Faz 11 — Fly kurulum + canlı deploy (Terminal.app)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/.roomio/faz11-deploy.log"
mkdir -p "$ROOT/.roomio"
: > "$LOG"

log() { echo "$@" | tee -a "$LOG"; }

log "════════════════════════════════════════"
log "  Roomio Faz 11 — Fly deploy"
log "  $(date)"
log "════════════════════════════════════════"

export PATH="$HOME/.fly/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v fly >/dev/null 2>&1; then
  log "[1/4] flyctl kuruluyor…"
  if command -v brew >/dev/null 2>&1; then
    brew install flyctl
  else
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
  fi
fi

log "[2/4] fly auth kontrol…"
if ! fly auth whoami >>"$LOG" 2>&1; then
  log "Fly oturumu yok — tarayıcıda giriş açılacak…"
  fly auth login >>"$LOG" 2>&1
fi
fly auth whoami | tee -a "$LOG"

cd "$ROOT"

log "[3/4] Canlı deploy…"
npm run deploy:fly:live >>"$LOG" 2>&1

PROD="$(cat .roomio/production-url.txt 2>/dev/null | tr -d '\n' || echo https://roomio-pms.fly.dev)"
log "[4/4] Faz 11 test — $PROD"
ROOMIO_PRODUCTION_URL="$PROD" ROOMIO_URL="$PROD" npm run test:faz11 -- --step 11.1 --step 11.3 >>"$LOG" 2>&1

log ""
log "✅ Faz 11 deploy tamamlandı → $PROD"
log "📱 Telefon: $PROD/housekeeping/mobile → Bildirimleri aç"
