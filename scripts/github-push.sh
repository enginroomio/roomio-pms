#!/usr/bin/env bash
# GitHub push — tek seferlik kurulum (Terminal.app'te çalıştırın)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ GitHub push — $ROOT"

if [[ ! -f .git/HEAD ]] && [[ ! -f .git ]] && [[ ! -d /Users/Engin/.git-roomio-pms ]]; then
  bash scripts/render-quickstart.sh
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ℹ gh CLI kuruluyor (Homebrew)…"
  if command -v brew >/dev/null 2>&1; then
    brew install gh
  else
    echo "✗ Homebrew yok — https://cli.github.com/ manuel kurun"
    exit 1
  fi
fi

echo "ℹ GitHub oturumu açılıyor…"
gh auth login --web --git-protocol https

read -rp "GitHub kullanıcı adınız: " GH_USER
gh repo create "${GH_USER}/roomio-pms" --private --source=. --remote=origin --push

echo "✅ GitHub push tamam"
echo "Sıradaki: https://dashboard.render.com → New → Blueprint → ${GH_USER}/roomio-pms"
