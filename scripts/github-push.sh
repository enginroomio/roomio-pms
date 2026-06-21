#!/usr/bin/env bash
# GitHub push — Homebrew gerekmez
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BIN="$ROOT/.roomio/bin"
GH_BIN="$BIN/gh"

echo "→ GitHub push — $ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "✗ Git deposu yok — önce: bash scripts/render-quickstart.sh"
  exit 1
fi

install_gh() {
  if command -v gh >/dev/null 2>&1; then return 0; fi
  if [[ -x "$GH_BIN" ]]; then export PATH="$BIN:$PATH"; return 0; fi

  echo "ℹ gh CLI indiriliyor (Homebrew gerekmez)…"
  mkdir -p "$BIN"
  ARCH="$(uname -m)"
  case "$ARCH" in
    arm64) TAG="arm64" ;;
    x86_64) TAG="amd64" ;;
    *) echo "✗ Desteklenmeyen mimari: $ARCH"; return 1 ;;
  esac
  TMP="$(mktemp -d)"
  curl -fsSL "https://github.com/cli/cli/releases/latest/download/gh_$(curl -fsSL https://api.github.com/repos/cli/cli/releases/latest | grep tag_name | head -1 | sed 's/.*"v//;s/".*//')_macOS_${TAG}.zip" -o "$TMP/gh.zip"
  unzip -q "$TMP/gh.zip" -d "$TMP"
  cp "$TMP"/gh_*/bin/gh "$GH_BIN"
  chmod +x "$GH_BIN"
  rm -rf "$TMP"
  export PATH="$BIN:$PATH"
  echo "✓ gh kuruldu → $GH_BIN"
}

push_with_git() {
  local GH_USER="$1"
  echo ""
  echo "📋 Manuel adımlar:"
  echo "  1. https://github.com/new → repo: roomio-pms (Private OK, README ekleme)"
  echo "  2. Token: https://github.com/settings/tokens → Generate (repo izni)"
  echo "  3. Push sırasında şifre yerine TOKEN yapıştırın"
  echo ""
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${GH_USER}/roomio-pms.git"
  git push -u origin main
}

# --- gh ile (tercih) ---
if install_gh 2>/dev/null; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "ℹ GitHub oturumu açılıyor (tarayıcı)…"
    gh auth login --web --git-protocol https
  fi
  GH_USER="$(gh api user -q .login 2>/dev/null || true)"
  if [[ -z "$GH_USER" ]]; then
    read -rp "GitHub kullanıcı adınız: " GH_USER
  else
    echo "✓ GitHub — $GH_USER"
  fi
  if git remote get-url origin >/dev/null 2>&1; then
    echo "ℹ origin mevcut — push deneniyor…"
    git push -u origin main
  else
    gh repo create "${GH_USER}/roomio-pms" --private --source=. --remote=origin --push
  fi
else
  echo "⚠ gh kurulamadı — düz git ile devam"
  read -rp "GitHub kullanıcı adınız: " GH_USER
  push_with_git "$GH_USER"
fi

echo ""
echo "✅ GitHub push tamam"
echo "Sıradaki:"
echo "  1. https://dashboard.render.com → Sign Up (GitHub)"
echo "  2. New → Blueprint → roomio-pms repo seç"
echo "  3. VAPID keys ekle (.env.vapid.generated)"
echo "  4. Deploy bitince:"
echo "     ROOMIO_PRODUCTION_URL=https://roomio-pms.onrender.com npm run test:render"
