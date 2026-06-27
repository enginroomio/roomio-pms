#!/usr/bin/env node
/**
 * Elektra / Konak PMS oda envanterini JSON olarak dışa aktarır.
 * Konak API çalışıyorsa: KONAK_URL=http://127.0.0.1:3001 node scripts/import-elektra-rooms.mjs
 * Aksi halde yerel room-config mantığı ile 77 oda üretir.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outPath = join(root, 'data', 'elektra-rooms.json');

const KONAK_URL = process.env.KONAK_URL ?? 'http://127.0.0.1:3001';

async function fromKonakApi() {
  const res = await fetch(`${KONAK_URL}/rooms/board`);
  if (!res.ok) throw new Error(`Konak API ${res.status}`);
  const data = await res.json();
  return { source: 'konak-api', exportedAt: new Date().toISOString(), ...data };
}

function localFallback() {
  // Dinamik import yerine sabit mantık — build gerektirmez
  const FLOORS = [
    { floor: 1, start: 101, end: 118 },
    { floor: 2, start: 201, end: 218 },
    { floor: 3, start: 301, end: 318 },
    { floor: 4, start: 401, end: 418 },
    { floor: 5, start: 501, end: 510 },
  ];
  const EXCLUDED = [6];
  const rooms = [];
  for (const { start, end } of FLOORS) {
    for (let num = start; num <= end; num++) {
      if (EXCLUDED.includes(num % 100)) continue;
      const floor = Math.floor(num / 100);
      const suffix = num % 100;
      rooms.push({ roomNo: String(num), floor, suffix });
    }
  }
  return {
    source: 'elektra-seed-logic',
    exportedAt: new Date().toISOString(),
    totalRooms: rooms.length,
    rooms,
  };
}

async function main() {
  let payload;
  try {
    payload = await fromKonakApi();
    console.log(`Konak API'den ${payload.rooms?.length ?? '?'} oda alındı`);
  } catch {
    payload = localFallback();
    console.log(`Yerel Elektra mantığı: ${payload.totalRooms} oda`);
  }
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`→ ${outPath}`);
}

main();
