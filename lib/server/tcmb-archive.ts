import fs from 'node:fs';
import path from 'node:path';
import type { ExchangeRateRow } from '@/lib/exchange/types';

export type TcmbArchiveEntry = {
  date: string;
  fetchedAt: string;
  sourceUrl?: string;
  rates: ExchangeRateRow[];
};

export type TcmbArchiveIndex = {
  dates: string[];
  lastSyncAt?: string;
  lastSyncDay?: string;
  lastRateDate?: string;
};

export type TcmbSyncState = {
  lastSyncDay?: string;
  lastSyncAt?: string;
  lastRateDate?: string;
  lastError?: string;
};

const ROOMIO_DIR = path.join(process.cwd(), '.roomio');
const ARCHIVE_DIR = path.join(ROOMIO_DIR, 'tcmb-archive');
const INDEX_FILE = path.join(ARCHIVE_DIR, 'index.json');
const STATE_FILE = path.join(ARCHIVE_DIR, 'state.json');

function archiveFileForDate(date: string): string {
  const [year, month] = date.split('-');
  return path.join(ARCHIVE_DIR, year, month, `${date}.json`);
}

function ensureArchiveDir(): void {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

function readJsonFile<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export function readArchiveIndex(): TcmbArchiveIndex {
  return readJsonFile<TcmbArchiveIndex>(INDEX_FILE) ?? { dates: [] };
}

export function writeArchiveIndex(index: TcmbArchiveIndex): void {
  ensureArchiveDir();
  const dates = [...new Set(index.dates)].sort((a, b) => b.localeCompare(a));
  writeJsonFile(INDEX_FILE, { ...index, dates });
}

export function readSyncState(): TcmbSyncState {
  return readJsonFile<TcmbSyncState>(STATE_FILE) ?? {};
}

export function writeSyncState(state: TcmbSyncState): void {
  ensureArchiveDir();
  writeJsonFile(STATE_FILE, state);
}

export function readArchiveEntry(date: string): TcmbArchiveEntry | null {
  const entry = readJsonFile<TcmbArchiveEntry>(archiveFileForDate(date));
  if (!entry?.rates?.length) return null;
  return entry;
}

export function writeArchiveEntry(entry: TcmbArchiveEntry): void {
  ensureArchiveDir();
  writeJsonFile(archiveFileForDate(entry.date), entry);
  const index = readArchiveIndex();
  if (!index.dates.includes(entry.date)) index.dates.push(entry.date);
  index.lastRateDate = entry.date;
  writeArchiveIndex(index);
}

/** İstenen gün veya ondan önceki en yakın arşiv kaydı */
export function findArchiveOnOrBefore(requestedDate: string): TcmbArchiveEntry | null {
  const index = readArchiveIndex();
  const hit = index.dates.find((d) => d <= requestedDate);
  return hit ? readArchiveEntry(hit) : null;
}

export function listArchiveDates(limit = 120): string[] {
  return readArchiveIndex().dates.slice(0, limit);
}

export function archiveStats(): TcmbArchiveIndex & TcmbSyncState & { totalDays: number } {
  const index = readArchiveIndex();
  const state = readSyncState();
  return {
    ...index,
    ...state,
    totalDays: index.dates.length,
  };
}
