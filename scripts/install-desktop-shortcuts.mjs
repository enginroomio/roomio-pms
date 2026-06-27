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
  // NOT: Bu script önceden multi-line PowerShell'i `powershell -Command "..."`
  // ile, satır sonlarını koruyarak tek bir çift-tırnaklı argümana gömerek
  // çalıştırıyordu. `execSync(cmd, { shell: true })` Windows'ta komutu
  // `cmd /d /s /c` üzerinden geçirir; bu katmanda gömülü newline'lar bazı
  // Node/Windows sürüm kombinasyonlarında komutun sessizce kesilmesine veya
  // hatalı ayrıştırılmasına yol açabilir (bilinen bir sınıf sorun: multiline
  // `-Command` argümanları kabuk katmanından geçerken kırılabilir). Script'i
  // geçici bir `.ps1` dosyasına yazıp `-File` ile çağırmak bu riski tamamen
  // ortadan kaldırır — newline'lar dosya içeriğinde kalır, kabuk katmanına
  // tek satır bir dosya yolu argümanı geçer.
  const ps = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
$Shortcut.TargetPath = '${batPath.replace(/'/g, "''")}'
$Shortcut.WorkingDirectory = '${ROOT.replace(/'/g, "''")}'
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Roomio Hotel PMS'
$Shortcut.Save()
`;
  const tmpScriptPath = join(ROOT, '.roomio-shortcut-tmp.ps1');
  writeFileSync(tmpScriptPath, ps, 'utf8');
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpScriptPath}"`, {
      stdio: 'inherit',
      shell: true,
    });
  } finally {
    rmSync(tmpScriptPath, { force: true });
  }
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
