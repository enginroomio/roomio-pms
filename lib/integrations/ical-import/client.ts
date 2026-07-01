import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  DEFAULT_ICAL_IMPORT_STORE,
  type IcalFeedConfig,
  type IcalImportStore,
  type IcalPulledRow,
} from '@/lib/integrations/ical-import/types';

const FILE = 'ical-import-feeds.json';

export async function loadIcalFeeds(): Promise<IcalImportStore> {
  return loadJsonConfig(FILE, DEFAULT_ICAL_IMPORT_STORE);
}

export async function saveIcalFeeds(store: IcalImportStore): Promise<void> {
  await saveJsonConfig(FILE, store);
}

export async function addIcalFeed(
  input: Omit<IcalFeedConfig, 'id' | 'createdAt'>,
): Promise<IcalFeedConfig> {
  const store = await loadIcalFeeds();
  const feed: IcalFeedConfig = {
    ...input,
    id: `ical-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.feeds.push(feed);
  await saveIcalFeeds(store);
  return feed;
}

export async function removeIcalFeed(id: string): Promise<void> {
  const store = await loadIcalFeeds();
  store.feeds = store.feeds.filter((f) => f.id !== id);
  await saveIcalFeeds(store);
}

export async function markFeedPulled(id: string): Promise<void> {
  const store = await loadIcalFeeds();
  const feed = store.feeds.find((f) => f.id === id);
  if (feed) feed.lastPulledAt = new Date().toISOString();
  await saveIcalFeeds(store);
}

type RawVEvent = { uid?: string; dtstart?: string; dtend?: string; summary?: string };

/** RFC 5545 satır birleştirme: devam satırları tek boşluk/tab ile başlar, önceki satıra eklenir. */
function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function unescapeIcalText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function toIsoDate(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 8);
  if (digits.length !== 8) return '';
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** Minimal VEVENT ayrıştırıcı — harici kütüphane kullanmadan UID/DTSTART/DTEND/SUMMARY çıkarır. */
export function parseIcalEvents(raw: string): RawVEvent[] {
  const lines = unfoldLines(raw);
  const events: RawVEvent[] = [];
  let current: RawVEvent | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const sep = trimmed.indexOf(':');
    if (sep === -1) continue;
    const rawKey = trimmed.slice(0, sep);
    const value = trimmed.slice(sep + 1);
    const key = (rawKey.split(';')[0] ?? '').toUpperCase();
    if (key === 'UID') current.uid = value.trim();
    else if (key === 'DTSTART') current.dtstart = toIsoDate(value);
    else if (key === 'DTEND') current.dtend = toIsoDate(value);
    else if (key === 'SUMMARY') current.summary = unescapeIcalText(value);
  }
  return events;
}

const BLOCK_KEYWORDS = ['not available', 'blocked', 'closed', 'unavailable', 'maintenance', 'kapalı', 'kapali'];

function isBlockSummary(summary: string): boolean {
  const lower = summary.toLowerCase();
  return BLOCK_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function fetchAndParseFeed(
  feed: IcalFeedConfig,
): Promise<{ ok: true; rows: IcalPulledRow[] } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(feed.url, { headers: { 'User-Agent': 'Roomio-PMS-iCal-Import/1.0' } });
  } catch {
    return { ok: false, message: 'Takvim linkine erişilemedi.' };
  }
  if (!res.ok) {
    return { ok: false, message: `Takvim linki hata döndü (HTTP ${res.status}).` };
  }
  const text = await res.text();
  const events = parseIcalEvents(text);
  const rows: IcalPulledRow[] = events
    .filter((e) => e.dtstart && e.dtend)
    .map((e) => ({
      uid: e.uid || `${feed.id}-${e.dtstart}-${e.dtend}`,
      checkIn: e.dtstart as string,
      checkOut: e.dtend as string,
      guestNameRaw: e.summary || '',
      roomType: feed.roomType,
      channel: feed.channel,
      isBlock: isBlockSummary(e.summary || ''),
    }));
  return { ok: true, rows };
}
