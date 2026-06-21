#!/usr/bin/env node
import { killPort, readActivePort, pruneStaleServers } from './roomio-port.mjs';

const HOST = process.env.ROOMIO_HOST ?? '127.0.0.1';
const kept = await pruneStaleServers();

if (!kept) {
  console.error('\nGüncel Roomio bulunamadı. Çalıştırın: npm run auto\n');
  process.exit(1);
}

if (kept !== readActivePort()) {
  console.log(`✓ Aktif port güncellendi: ${kept}`);
}

console.log(`\nKullanın: http://${HOST}:${kept}/\n`);
