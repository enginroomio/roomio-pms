#!/usr/bin/env node
/** Roomio portlarını ve ilişkili süreçleri kapatır (macOS + Windows). */
import { execSync } from 'node:child_process';

const PORT_START = Number(process.env.ROOMIO_PORT_START ?? 3100);
const PORT_END = Number(process.env.ROOMIO_PORT_END ?? 3200);

function killPortUnix(port) {
  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      try {
        process.kill(Number(pid), 'SIGKILL');
        console.log(`[kill] Kapatıldı PID ${pid} (port ${port})`);
      } catch {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`[kill] kill -9 ile kapatıldı PID ${pid} (port ${port})`);
        } catch {
          console.warn(`[kill] PID ${pid} kapatılamadı — Terminal'de: kill -9 ${pid}`);
        }
      }
    }
  } catch {
    // port boş
  }
}

function killPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', shell: true });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', shell: true });
        console.log(`[kill] Kapatıldı PID ${pid} (port ${port})`);
      } catch {
        console.warn(`[kill] PID ${pid} kapatılamadı`);
      }
    }
  } catch {
    // port boş
  }
}

const killPort = process.platform === 'win32' ? killPortWindows : killPortUnix;

for (let port = PORT_START; port <= PORT_END; port += 1) {
  killPort(port);
}

if (process.platform !== 'win32') {
  try {
    execSync('pkill -9 -f "next start"', { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

console.log(`[kill] Portlar temizlendi (${PORT_START}–${PORT_END}).`);
