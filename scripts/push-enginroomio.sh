#!/usr/bin/env bash
# enginroomio/roomio-pms → GitHub push (gitdir uyumlu)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ $(pwd)"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "✗ Git deposu yok"
  exit 1
fi

git add -A
git diff --cached --quiet || git commit -m "Roomio sync before Render deploy"

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/enginroomio/roomio-pms.git"

echo "ℹ Push — https://github.com/enginroomio/roomio-pms"
git branch -M main
git push -u origin main

echo ""
echo "✅ GitHub push tamam"
echo "Sıradaki: https://dashboard.render.com → New → Blueprint → enginroomio/roomio-pms"
