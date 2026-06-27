#!/usr/bin/env node
/** Eski Roomio / Next süreçlerini kapatır (port çakışması → tarayıcıda sonsuz "Yükleniyor"). */
import { execSync } from 'node:child_process';

const PORTS = [3100, 3106, 3108, 3119, 3120, 3121, 3122, 3123, 3124, 3125, 3126];

for (const port of PORTS) {
  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (!out) continue;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      try {
        process.kill(Number(pid), 'SIGKILL');
        console.log(`Kapatıldı PID ${pid} (port ${port})`);
      } catch {
        console.warn(`PID ${pid} kapatılamadı — Terminal'de: kill -9 ${pid}`);
      }
    }
  } catch {
    // port boş
  }
}

console.log('Portlar temizlendi. Şimdi: npm run up');
