#!/usr/bin/env bash
# Roomio Render kurulum — her zaman doğru klasörden çalışır.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "→ $ROOT"

if [[ ! -f package.json ]]; then
  echo "✗ package.json bulunamadı"
  exit 1
fi

if [[ -d .git ]] && [[ ! -f .git/HEAD ]]; then
  echo "ℹ Bozuk .git temizleniyor…"
  rm -rf .git
fi

if [[ ! -f .git/HEAD ]]; then
  echo "ℹ Git deposu oluşturuluyor…"
  GIT_TEMPLATE_DIR= git init -b main --template=
  git add -A
  git -c user.email="${GIT_AUTHOR_EMAIL:-engin@roomio.local}" \
      -c user.name="${GIT_AUTHOR_NAME:-Engin}" \
      commit -m "Roomio PMS — Render production deploy"
  echo "✓ Git commit oluşturuldu"
fi

npm run setup:render
