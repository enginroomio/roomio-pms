import { enrichSnapshot } from '@/lib/exchange/apply';
import { buildTcmbSeedRates } from '@/lib/exchange/tcmb-seed-snapshot';
import type { ExchangeRateRow, ExchangeRateSnapshot } from '@/lib/exchange/types';
import { STATUS_BAR_FX_CODES } from '@/lib/exchange/types';
import { getExchangeConfig } from '@/lib/server/pms-store';
import { importCacheToArchive, ratesFromArchive } from '@/lib/server/tcmb-daily-sync';
import { writeArchiveEntry } from '@/lib/server/tcmb-archive';
import { readTcmbCache, seedTcmbCacheIfMissing, writeTcmbCache } from '@/lib/server/tcmb-cache';
import { fetchTcmbRates, todayTurkey } from '@/lib/server/tcmb-rates';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export type RateOrigin = 'live' | 'archive' | 'cache' | 'seed';

export type ExchangeRatesResult = ExchangeRateSnapshot & {
  ok: boolean;
  origin: RateOrigin;
  /** @deprecated origin=archive|cache için true */
  stale?: boolean;
  /** @deprecated origin=archive için true */
  archived?: boolean;
  seeded?: boolean;
  error?: string;
  fetchError?: string;
};

function businessDate(): string {
  return PROPERTY.businessDate || todayTurkey();
}

function mergeRatesWithSeed(rates: ExchangeRateRow[], date: string): ExchangeRateRow[] {
  const seed = buildTcmbSeedRates(date).rates;
  const map = new Map(rates.map((r) => [r.code, r]));
  for (const row of seed) {
    if (!map.has(row.code)) map.set(row.code, row);
  }
  for (const code of STATUS_BAR_FX_CODES) {
    if (!map.has(code)) {
      const fallback = seed.find((r) => r.code === code);
      if (fallback) map.set(code, fallback);
    }
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code, 'tr'));
}

function persistRates(date: string, rates: ExchangeRateRow[], fetchedAt: string, sourceUrl?: string): ExchangeRateRow[] {
  const merged = mergeRatesWithSeed(rates, date);
  writeTcmbCache({ date, fetchedAt, rates: merged });
  writeArchiveEntry({ date, fetchedAt, rates: merged, sourceUrl });
  return merged;
}

function buildResult(
  config: Awaited<ReturnType<typeof getExchangeConfig>>,
  date: string,
  rates: ExchangeRateRow[],
  updatedAt: string,
  origin: RateOrigin,
  debug?: { fetchError?: string },
): ExchangeRatesResult {
  return {
    ok: true,
    origin,
    stale: origin === 'cache' || origin === 'seed',
    archived: origin === 'archive',
    seeded: origin === 'seed',
    ...enrichSnapshot({ source: 'tcmb', date, updatedAt, rates }, config),
    ...(debug?.fetchError && origin !== 'live' ? { fetchError: debug.fetchError } : {}),
  };
}

export function ensureTcmbSeedCache(): void {
  importCacheToArchive();
  const date = businessDate();
  const existing = readTcmbCache();
  if (!existing) {
    seedTcmbCacheIfMissing({
      date,
      fetchedAt: new Date().toISOString(),
      rates: buildTcmbSeedRates(date).rates,
      seeded: true,
    });
    return;
  }
  const merged = mergeRatesWithSeed(existing.rates, date);
  if (merged.length !== existing.rates.length) {
    writeTcmbCache({ ...existing, rates: merged, date: existing.date || date });
  }
}

export async function getExchangeRatesSnapshot(
  propertyId: string,
  opts?: { force?: boolean; date?: string; debug?: boolean },
): Promise<ExchangeRatesResult> {
  ensureTcmbSeedCache();
  const config = await getExchangeConfig(propertyId);

  const hasExplicitDate = Boolean(opts?.date);
  const preferredDate = opts?.date ?? todayTurkey();
  const mode = hasExplicitDate ? 'on-or-before' as const : 'latest' as const;

  if (!opts?.force) {
    const archived = ratesFromArchive(preferredDate);
    if (archived?.rates?.length) {
      const rates = mergeRatesWithSeed(archived.rates, archived.date);
      return buildResult(config, archived.date, rates, archived.fetchedAt, 'archive');
    }
  }

  try {
    const tcmb = await fetchTcmbRates({ force: opts?.force, date: preferredDate, mode });
    const fetchedAt = new Date().toISOString();
    const rates = persistRates(tcmb.date, tcmb.rates, fetchedAt);
    return buildResult(config, tcmb.date, rates, fetchedAt, 'live');
  } catch (e) {
    const fetchError = e instanceof Error ? e.message : 'TCMB erişilemedi';
    console.warn('[roomio/tcmb]', fetchError);

    const cached = readTcmbCache();
    if (cached?.rates?.length && !cached.seeded) {
      const rates = mergeRatesWithSeed(cached.rates, cached.date || preferredDate);
      return buildResult(config, cached.date, rates, cached.fetchedAt, 'cache', opts?.debug ? { fetchError } : undefined);
    }

    if (cached?.rates?.length && cached.seeded) {
      const rates = mergeRatesWithSeed(cached.rates, cached.date || preferredDate);
      return buildResult(config, cached.date, rates, cached.fetchedAt, 'seed', opts?.debug ? { fetchError } : undefined);
    }

    throw e;
  }
}

export async function warmTcmbCache(): Promise<void> {
  try {
    const { syncTcmbDaily } = await import('@/lib/server/tcmb-daily-sync');
    await syncTcmbDaily({ backfillDays: 7 });
  } catch (e) {
    console.warn('[roomio/tcmb] warm-up başarısız:', e instanceof Error ? e.message : e);
  }
}

export { DEFAULT_PROPERTY_ID };
