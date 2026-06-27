import { readTcmbCache } from '@/lib/server/tcmb-cache';
import {
  findArchiveOnOrBefore,
  readArchiveEntry,
  readArchiveIndex,
  readSyncState,
  writeArchiveEntry,
  writeArchiveIndex,
  writeSyncState,
  type TcmbArchiveEntry,
} from '@/lib/server/tcmb-archive';
import { fetchTcmbRates, tcmbUrlForDate, todayTurkey, TcmbRateError } from '@/lib/server/tcmb-rates';

export type TcmbDailySyncResult = {
  ok: boolean;
  skipped?: boolean;
  date?: string;
  fetchedAt?: string;
  sourceUrl?: string;
  backfilled?: number;
  error?: string;
};

async function fetchArchiveDay(isoDate: string): Promise<TcmbArchiveEntry | null> {
  const existing = readArchiveEntry(isoDate);
  if (existing) return existing;

  try {
    const tcmb = await fetchTcmbRates({ force: true, date: isoDate, mode: 'on-or-before' });
    const entry: TcmbArchiveEntry = {
      date: tcmb.date,
      fetchedAt: new Date().toISOString(),
      sourceUrl: tcmbUrlForDate(isoDate),
      rates: tcmb.rates,
    };
    writeArchiveEntry(entry);
    return entry;
  } catch {
    return null;
  }
}

/** Mevcut canlı önbelleği arşive aktar */
export function importCacheToArchive(): TcmbArchiveEntry | null {
  const cache = readTcmbCache();
  if (!cache?.rates?.length || cache.seeded) return null;
  if (readArchiveEntry(cache.date)) return readArchiveEntry(cache.date);

  const entry: TcmbArchiveEntry = {
    date: cache.date,
    fetchedAt: cache.fetchedAt,
    rates: cache.rates,
  };
  writeArchiveEntry(entry);
  return entry;
}

/** Günlük TCMB çekimi — aynı takvim gününde bir kez (force hariç) */
export async function syncTcmbDaily(opts?: {
  force?: boolean;
  backfillDays?: number;
}): Promise<TcmbDailySyncResult> {
  importCacheToArchive();

  const today = todayTurkey();
  const state = readSyncState();
  if (!opts?.force && state.lastSyncDay === today) {
    const existing = readArchiveEntry(state.lastRateDate ?? '') ?? findArchiveOnOrBefore(today);
    return {
      ok: true,
      skipped: true,
      date: existing?.date,
      fetchedAt: existing?.fetchedAt,
    };
  }

  try {
    const tcmb = await fetchTcmbRates({ force: true, mode: 'latest' });
    const entry: TcmbArchiveEntry = {
      date: tcmb.date,
      fetchedAt: new Date().toISOString(),
      sourceUrl: 'https://www.tcmb.gov.tr/kurlar/today.xml',
      rates: tcmb.rates,
    };
    writeArchiveEntry(entry);
    writeSyncState({
      lastSyncDay: today,
      lastSyncAt: entry.fetchedAt,
      lastRateDate: entry.date,
      lastError: undefined,
    });
    const index = readArchiveIndex();
    writeArchiveIndex({
      ...index,
      lastSyncAt: entry.fetchedAt,
      lastSyncDay: today,
      lastRateDate: entry.date,
    });

    let backfilled = 0;
    const days = opts?.backfillDays ?? 0;
    for (let i = 1; i <= days; i += 1) {
      const day = new Date(`${today}T12:00:00+03:00`);
      day.setDate(day.getDate() - i);
      const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(day);
      if (readArchiveEntry(iso)) continue;
      const filled = await fetchArchiveDay(iso);
      if (filled) backfilled += 1;
    }

    return {
      ok: true,
      date: entry.date,
      fetchedAt: entry.fetchedAt,
      sourceUrl: entry.sourceUrl,
      backfilled,
    };
  } catch (e) {
    const message = e instanceof TcmbRateError ? e.message : (e instanceof Error ? e.message : 'TCMB sync hatası');
    writeSyncState({ ...state, lastError: message });
    return { ok: false, error: message };
  }
}

/** Arşivden kur satırları — canlı fetch başarısız olduğunda */
export function ratesFromArchive(requestedDate: string): TcmbArchiveEntry | null {
  return readArchiveEntry(requestedDate) ?? findArchiveOnOrBefore(requestedDate);
}

/** Son N günü TCMB arşiv URL'lerinden doldur */
export async function backfillTcmbArchive(days = 30): Promise<{ ok: boolean; added: number; error?: string }> {
  importCacheToArchive();
  const today = todayTurkey();
  let added = 0;

  for (let i = 0; i < days; i += 1) {
    const day = new Date(`${today}T12:00:00+03:00`);
    day.setDate(day.getDate() - i);
    const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(day);
    if (readArchiveEntry(iso)) continue;
    const filled = await fetchArchiveDay(iso);
    if (filled) added += 1;
  }

  return { ok: true, added };
}
