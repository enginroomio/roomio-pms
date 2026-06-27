#!/usr/bin/env node
/**
 * macOS .app paketleri oluşturur — Terminal açılmadan Finder'dan çift tık.
 *   node scripts/build-mac-app.mjs
 *   node scripts/build-mac-app.mjs --out ~/Desktop
 */
import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const APPS = [
  {
    name: 'Roomio',
    bundleId: 'com.roomio.pms.chrome',
    displayName: 'Roomio',
    browser: 'chrome',
  },
  {
    name: 'Roomio Safari',
    bundleId: 'com.roomio.pms.safari',
    displayName: 'Roomio Safari',
    browser: 'safari',
  },
];

function parseOutDir(argv) {
  const idx = argv.indexOf('--out');
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1].replace(/^~(?=\/|$)/, homedir());
  return join(ROOT, 'launchers');
}

function launcherScript(projectRoot, browser) {
  return `#!/bin/bash
set -euo pipefail

ROOMIO_ROOT=${JSON.stringify(projectRoot)}
NODE_BIN=""
for CAND in "/opt/homebrew/bin/node" "/usr/local/bin/node" "$(command -v node 2>/dev/null)"; do
  if [ -n "$CAND" ] && [ -x "$CAND" ]; then NODE_BIN="$CAND"; break; fi
done
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export ROOMIO_BROWSER="${browser}"

LOG_DIR="$ROOMIO_ROOT/.roomio/runtime"
LOG_FILE="$LOG_DIR/launcher.log"
mkdir -p "$LOG_DIR"

if [ ! -f "$ROOMIO_ROOT/package.json" ]; then
  osascript -e 'display alert "Roomio" message "Proje klasörü bulunamadı. npm run install-shortcuts ile kısayolu yenileyin." as critical'
  exit 1
fi

if [ -z "$NODE_BIN" ]; then
  osascript -e 'display alert "Roomio" message "Node.js bulunamadı. https://nodejs.org adresinden kurun." as critical'
  exit 1
fi

cd "$ROOMIO_ROOT"

{
  echo "=== Roomio $(date) · ${browser} ==="
  "$NODE_BIN" scripts/roomio-desktop.mjs
} >> "$LOG_FILE" 2>&1 || {
  EC=$?
  osascript -e "display alert \\"Roomio başlatılamadı\\" message \\"Log: $LOG_FILE\\" as critical"
  exit $EC
}
`;
}

function infoPlist({ execName, bundleId, displayName }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>tr</string>
  <key>CFBundleExecutable</key>
  <string>${execName}</string>
  <key>CFBundleIdentifier</key>
  <string>${bundleId}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${displayName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

export function buildMacApps(projectRoot, outDir) {
  mkdirSync(outDir, { recursive: true });
  const built = [];

  for (const spec of APPS) {
    const appDir = join(outDir, `${spec.name}.app`);
    const macosDir = join(appDir, 'Contents', 'MacOS');
    const execName = 'roomio-launcher';

    rmSync(appDir, { recursive: true, force: true });
    mkdirSync(macosDir, { recursive: true });

    const launcherPath = join(macosDir, execName);
    writeFileSync(launcherPath, launcherScript(projectRoot, spec.browser), { encoding: 'utf8', mode: 0o755 });
    chmodSync(launcherPath, 0o755);

    writeFileSync(
      join(appDir, 'Contents', 'Info.plist'),
      infoPlist({ execName, bundleId: spec.bundleId, displayName: spec.displayName }),
      'utf8',
    );

    built.push(appDir);
    console.log('[mac-app]', appDir);
  }

  return built;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outDir = parseOutDir(process.argv.slice(2));
  buildMacApps(ROOT, outDir);
  console.log('\nTerminal açılmaz — Finder\'dan .app dosyasına çift tıklayın.\n');
}
