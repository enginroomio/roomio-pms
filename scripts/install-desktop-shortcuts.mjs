#!/usr/bin/env node
/**
 * Masaüstü kısayolu: macOS .app (Terminal yok) / Windows .lnk
 *   npm run install-shortcuts
 */
import { execSync } from 'node:child_process';
import { chmodSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMacApps } from './build-mac-app.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESKTOP = join(homedir(), 'Desktop');

function installMac() {
  buildMacApps(ROOT, join(ROOT, 'launchers'));

  for (const name of ['Roomio.app', 'Roomio Safari.app']) {
    const src = join(ROOT, 'launchers', name);
    const dest = join(DESKTOP, name);
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log('[install] macOS →', dest);
  }

  for (const legacy of ['Roomio.command', 'Roomio (Chrome).command', 'Roomio (Safari).command']) {
    rmSync(join(DESKTOP, legacy), { force: true });
  }

  const fixSrc = join(ROOT, 'launchers', 'Roomio-Duzelt.command');
  const fixDest = join(DESKTOP, 'Roomio Duzelt.command');
  chmodSync(fixSrc, 0o755);
  cpSync(fixSrc, fixDest);
  console.log('[install] macOS →', fixDest);
}

function installWindows() {
  const batPath = join(DESKTOP, 'Roomio.bat');
  const body = `@echo off\r\ncd /d "${ROOT.replace(/\\/g, '\\\\')}"\r\nset ROOMIO_BROWSER=chrome\r\nnode scripts\\roomio-desktop.mjs\r\nif errorlevel 1 pause\r\n`;
  writeFileSync(batPath, body, 'utf8');

  const lnkPath = join(DESKTOP, 'Roomio.lnk');
  const ps = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
$Shortcut.TargetPath = '${batPath.replace(/'/g, "''")}'
$Shortcut.WorkingDirectory = '${ROOT.replace(/'/g, "''")}'
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Roomio Hotel PMS'
$Shortcut.Save()
`;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
    shell: true,
  });
  console.log('[install] Windows →', batPath);
  console.log('[install] Windows →', lnkPath);
}

if (process.platform === 'win32') {
  installWindows();
} else {
  installMac();
}

console.log('\nKısayollar hazır.');
if (process.platform === 'darwin') {
  console.log('  ~/Desktop/Roomio.app         → Chrome (Terminal açılmaz)');
  console.log('  ~/Desktop/Roomio Safari.app  → Safari (Terminal açılmaz)');
  console.log('  Proje: launchers/Roomio.app\n');
} else {
  console.log('  ~/Desktop/Roomio.lnk\n');
}
