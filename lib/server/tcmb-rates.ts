import https from 'node:https';
import { CURRENCY_SYMBOLS, type ExchangeRateRow } from '@/lib/exchange/types';

let cache: { date: string; rates: ExchangeRateRow[] } | null = null;

const TCMB_TODAY = 'https://www.tcmb.gov.tr/kurlar/today.xml';
const FETCH_TIMEOUT_MS = 15_000;

const TCMB_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://www.tcmb.gov.tr/',
  'Cache-Control': 'no-cache',
};

export class TcmbRateError extends Error {
  constructor(message = 'TCMB kurları alınamadı') {
    super(message);
    this.name = 'TcmbRateError';
  }
}

function parseNum(raw: string | undefined): number {
  if (!raw || raw.trim() === '') return 0;
  return Number(raw.replace(',', '.')) || 0;
}

export function todayTurkey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
}

function isoFromDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(date);
}

/** TCMB arşiv: /kurlar/YYYYMM/DDMMYYYY.xml */
export function tcmbUrlForDate(isoDate: string): string {
  if (isoDate === todayTurkey()) return TCMB_TODAY;
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) throw new TcmbRateError(`Geçersiz kur tarihi: ${isoDate}`);
  return `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;
}

export function tcmbCandidateUrls(preferredDate: string, mode: 'latest' | 'on-or-before' = 'latest'): string[] {
  const urls: string[] = [];
  if (mode === 'latest') urls.push(TCMB_TODAY);

  for (let i = 0; i < 10; i += 1) {
    const day = new Date(`${preferredDate}T12:00:00+03:00`);
    day.setDate(day.getDate() - i);
    const archive = tcmbUrlForDate(isoFromDate(day));
    if (!urls.includes(archive)) urls.push(archive);
  }

  if (mode === 'on-or-before' && !urls.includes(TCMB_TODAY)) {
    urls.push(TCMB_TODAY);
  }

  return urls;
}

function parseTcmbXml(xml: string): { date: string; rates: ExchangeRateRow[] } {
  const dateMatch = xml.match(/Tarih="([^"]+)"/) ?? xml.match(/Date="([^"]+)"/);
  const dateRaw = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);
  const date = dateRaw.includes('.') ? dateRaw.split('.').reverse().join('-') : dateRaw;
  const blocks = xml.match(/<Currency[\s\S]*?<\/Currency>/g) ?? [];
  const rates: ExchangeRateRow[] = [];

  for (const block of blocks) {
    const code = block.match(/CurrencyCode="([^"]+)"/)?.[1];
    if (!code || code === 'XDR') continue;
    const unit = parseNum(block.match(/<Unit>([^<]*)<\/Unit>/)?.[1]) || 1;
    const forexBuying = parseNum(block.match(/<ForexBuying>([^<]*)<\/ForexBuying>/)?.[1]);
    const forexSelling = parseNum(block.match(/<ForexSelling>([^<]*)<\/ForexSelling>/)?.[1]);
    const banknoteBuying = parseNum(block.match(/<BanknoteBuying>([^<]*)<\/BanknoteBuying>/)?.[1]);
    const banknoteSelling = parseNum(block.match(/<BanknoteSelling>([^<]*)<\/BanknoteSelling>/)?.[1]);
    const buy = (forexBuying || banknoteBuying) / unit;
    const sell = (forexSelling || banknoteSelling || forexBuying) / unit;
    if (!buy) continue;
    const tryPerUnitBuy = buy;
    const tryPerUnitSell = sell || buy;
    rates.push({
      code,
      name: block.match(/<Isim>([^<]*)<\/Isim>/)?.[1] ?? code,
      unit,
      symbol: CURRENCY_SYMBOLS[code] ?? code,
      tryPerUnit: tryPerUnitBuy,
      tryPerUnitBuy,
      tryPerUnitSell,
      tryPerUnitExchange: tryPerUnitBuy,
      forexBuying: forexBuying / unit,
      forexSelling: forexSelling / unit,
      banknoteBuying: banknoteBuying / unit,
      banknoteSelling: banknoteSelling / unit,
    });
  }

  return { date, rates };
}

function fetchTcmbWithHttps(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: TCMB_HEADERS, timeout: FETCH_TIMEOUT_MS }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new TcmbRateError(`TCMB HTTP ${res.statusCode} (${url})`));
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new TcmbRateError(`TCMB zaman aşımı (${url})`));
    });
  });
}

async function fetchTcmbXml(url: string): Promise<string> {
  let text: string | undefined;
  let lastError: unknown;

  for (const attempt of ['https', 'fetch'] as const) {
    try {
      if (attempt === 'https') {
        text = await fetchTcmbWithHttps(url);
      } else {
        const res = await fetch(url, {
          headers: TCMB_HEADERS,
          cache: 'no-store',
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          redirect: 'follow',
        });
        if (!res.ok) throw new TcmbRateError(`TCMB HTTP ${res.status} (${url})`);
        text = await res.text();
      }
      if (!text.includes('<Currency')) throw new TcmbRateError(`TCMB geçersiz yanıt (${url})`);
      return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof TcmbRateError
    ? lastError
    : new TcmbRateError(lastError instanceof Error ? lastError.message : 'TCMB kurları alınamadı');
}

async function fetchFromCandidates(urls: string[]): Promise<{ date: string; rates: ExchangeRateRow[]; sourceUrl: string }> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const xml = await fetchTcmbXml(url);
      const parsed = parseTcmbXml(xml);
      if (parsed.rates.length === 0) throw new TcmbRateError('TCMB boş yanıt');
      return {
        date: parsed.date,
        rates: parsed.rates.sort((a, b) => a.code.localeCompare(b.code, 'tr')),
        sourceUrl: url,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof TcmbRateError
    ? lastError
    : new TcmbRateError(lastError instanceof Error ? lastError.message : 'TCMB kurları alınamadı');
}

export async function fetchTcmbRates(opts?: {
  force?: boolean;
  date?: string;
  mode?: 'latest' | 'on-or-before';
}): Promise<{ date: string; rates: ExchangeRateRow[] }> {
  const today = todayTurkey();
  const preferredDate = opts?.date ?? today;
  const mode = opts?.mode ?? (opts?.date ? 'on-or-before' : 'latest');

  if (!opts?.force && !opts?.date && mode === 'latest' && cache && cache.date === today) {
    return cache;
  }

  const urls = tcmbCandidateUrls(preferredDate, mode);
  const result = await fetchFromCandidates(urls);

  if (mode === 'latest' && !opts?.date) cache = { date: result.date, rates: result.rates };
  return { date: result.date, rates: result.rates };
}
