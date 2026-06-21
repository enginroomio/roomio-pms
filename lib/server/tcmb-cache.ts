import fs from 'node:fs';
import path from 'node:path';
import type { ExchangeRateRow } from '@/lib/exchange/types';

export type TcmbCacheEntry = {
  date: string;
  fetchedAt: string;
  rates: ExchangeRateRow[];
  /** İlk kurulum demo snapshot — ilk TCMB başarısında silinir */
  seeded?: boolean;
};

const CACHE_DIR = path.join(process.cwd(), '.roomio');
const CACHE_FILE = path.join(CACHE_DIR, 'tcmb-cache.json');

export function readTcmbCache(): TcmbCacheEntry | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as TcmbCacheEntry;
    if (!parsed?.rates?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTcmbCache(entry: TcmbCacheEntry): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ ...entry, seeded: false }, null, 2), 'utf8');
}

export function seedTcmbCacheIfMissing(entry: TcmbCacheEntry): void {
  if (readTcmbCache()) return;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ ...entry, seeded: true }, null, 2), 'utf8');
}
