import fs from 'node:fs/promises';
import path from 'node:path';
import { decryptServerBlob, encryptServerBlob, ensureDataDir } from '@/lib/server/local-store';
import {
  DEFAULT_HOTSPOT_5651_CONFIG,
  LAW_5651_RETENTION_DAYS_DEFAULT,
  type BtkExportBundle,
  type Hotspot5651Config,
  type Hotspot5651Store,
  type HotspotSessionLog,
  type GuestWifiCredential,
} from '@/lib/integrations/hotspot5651/types';

const STORE_FILE = process.env.ROOMIO_5651_STORE
  ?? path.join(process.cwd(), '.roomio-data', 'hotspot-5651.enc');

const STORE_CACHE_MS = 5000;
let storeCache: { data: Hotspot5651Store; at: number } | null = null;

function invalidateStoreCache(): void {
  storeCache = null;
}

function maskId(value: string, type: HotspotSessionLog['guestIdType']): string {
  if (!value) return '***';
  if (type === 'tc' && value.length >= 11) return `${value.slice(0, 3)}****${value.slice(-2)}`;
  if (value.length <= 4) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

async function readStore(): Promise<Hotspot5651Store> {
  if (storeCache && Date.now() - storeCache.at < STORE_CACHE_MS) {
    return storeCache.data;
  }

  await ensureDataDir();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const store = decryptServerBlob<Hotspot5651Store>(raw);
    if (!store.credentials?.length) store.credentials = seedDemoCredentials();
    storeCache = { data: store, at: Date.now() };
    return store;
  } catch {
    const store = {
      config: DEFAULT_HOTSPOT_5651_CONFIG,
      logs: seedDemoLogs(),
      credentials: seedDemoCredentials(),
      updatedAt: new Date().toISOString(),
    };
    storeCache = { data: store, at: Date.now() };
    return store;
  }
}

function seedDemoCredentials(): GuestWifiCredential[] {
  const year = new Date().getFullYear();
  return [
    {
      roomNo: '412',
      authUser: 'room412',
      password: `R412${year}`,
      guestName: 'Ayşe Yılmaz',
      reservationId: '1',
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      roomNo: '305',
      authUser: 'room305',
      password: `R305${year}`,
      guestName: 'James Miller',
      reservationId: '2',
      expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
      active: true,
    },
  ];
}

async function writeStore(store: Hotspot5651Store): Promise<void> {
  await ensureDataDir();
  store.updatedAt = new Date().toISOString();
  await fs.writeFile(STORE_FILE, encryptServerBlob(store), 'utf8');
  invalidateStoreCache();
}

function seedDemoLogs(): HotspotSessionLog[] {
  const now = Date.now();
  return [
    {
      id: 'hs-001',
      startedAt: new Date(now - 3_600_000).toISOString(),
      endedAt: new Date(now - 600_000).toISOString(),
      internalIp: '10.10.42.118',
      internalPort: 49152,
      externalIp: '85.34.12.44',
      externalPort: 44312,
      macAddress: 'AA:BB:CC:11:22:33',
      bytesIn: 45_200_000,
      bytesOut: 8_100_000,
      guestName: 'Mehmet K.',
      guestIdType: 'tc',
      guestIdMasked: '123****89',
      roomNo: '412',
      reservationId: 'res-8841',
      authUser: 'room412',
      source: 'radius',
      userAgent: 'Mozilla/5.0 (iPhone)',
      hotspotZone: 'Lobby-Guest',
      btkCompliant: true,
      createdAt: new Date(now - 3_600_000).toISOString(),
    },
    {
      id: 'hs-002',
      startedAt: new Date(now - 7_200_000).toISOString(),
      endedAt: null,
      internalIp: '10.10.42.205',
      internalPort: 51234,
      externalIp: '85.34.12.44',
      externalPort: 44102,
      macAddress: 'DE:AD:BE:EF:00:01',
      bytesIn: 120_000_000,
      bytesOut: 22_000_000,
      guestName: 'Anna S.',
      guestIdType: 'passport',
      guestIdMasked: 'P0***78',
      roomNo: '305',
      reservationId: 'res-8830',
      authUser: 'room305',
      source: 'syslog',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
      hotspotZone: 'Floor-3',
      btkCompliant: true,
      createdAt: new Date(now - 7_200_000).toISOString(),
    },
  ];
}

function purgeExpired(logs: HotspotSessionLog[], retentionDays: number): HotspotSessionLog[] {
  const minDays = Math.max(retentionDays, 365);
  const cutoff = Date.now() - minDays * 86_400_000;
  return logs.filter((log) => new Date(log.startedAt).getTime() >= cutoff);
}

export async function loadHotspot5651Config(): Promise<Hotspot5651Config> {
  const store = await readStore();
  return {
    ...DEFAULT_HOTSPOT_5651_CONFIG,
    ...store.config,
    mikrotik: { ...DEFAULT_HOTSPOT_5651_CONFIG.mikrotik, ...store.config.mikrotik },
    unifi: { ...DEFAULT_HOTSPOT_5651_CONFIG.unifi, ...store.config.unifi },
  };
}

export async function saveHotspot5651Config(config: Hotspot5651Config): Promise<void> {
  const store = await readStore();
  store.config = {
    ...DEFAULT_HOTSPOT_5651_CONFIG,
    ...config,
    mikrotik: { ...DEFAULT_HOTSPOT_5651_CONFIG.mikrotik, ...config.mikrotik },
    unifi: { ...DEFAULT_HOTSPOT_5651_CONFIG.unifi, ...config.unifi },
    retentionDays: Math.max(config.retentionDays, 365),
  };
  if (store.config.autoArchive) {
    store.logs = purgeExpired(store.logs, store.config.retentionDays);
  }
  await writeStore(store);
}

export async function listHotspotLogs(opts?: {
  from?: string;
  to?: string;
  roomNo?: string;
  limit?: number;
}): Promise<HotspotSessionLog[]> {
  const store = await readStore();
  let logs = [...store.logs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  if (opts?.from) {
    const fromMs = new Date(opts.from).getTime();
    logs = logs.filter((l) => new Date(l.startedAt).getTime() >= fromMs);
  }
  if (opts?.to) {
    const toMs = new Date(opts.to).getTime();
    logs = logs.filter((l) => new Date(l.startedAt).getTime() <= toMs);
  }
  if (opts?.roomNo) {
    logs = logs.filter((l) => l.roomNo === opts.roomNo);
  }
  const limit = opts?.limit ?? 500;
  return logs.slice(0, limit);
}

export async function appendHotspotLog(
  entry: Omit<HotspotSessionLog, 'id' | 'createdAt' | 'guestIdMasked' | 'btkCompliant'> & {
    guestIdRaw?: string;
  },
): Promise<HotspotSessionLog> {
  const store = await readStore();
  if (!store.config.enabled) {
    throw new Error('5651 hotspot loglama kapalı');
  }

  const full: HotspotSessionLog = {
    ...entry,
    id: `hs-${Date.now().toString(36)}`,
    guestIdMasked: maskId(entry.guestIdRaw ?? '', entry.guestIdType),
    btkCompliant: Boolean(entry.internalIp && entry.macAddress && entry.startedAt),
    createdAt: new Date().toISOString(),
  };

  store.logs.unshift(full);
  if (store.config.autoArchive) {
    store.logs = purgeExpired(store.logs, store.config.retentionDays);
  }
  await writeStore(store);
  return full;
}

export async function closeHotspotSession(id: string, endedAt?: string): Promise<HotspotSessionLog | null> {
  const store = await readStore();
  const log = store.logs.find((l) => l.id === id);
  if (!log) return null;
  log.endedAt = endedAt ?? new Date().toISOString();
  log.provisioned = false;
  await writeStore(store);
  return log;
}

export async function findActiveSessions(opts: {
  authUser?: string;
  roomNo?: string;
}): Promise<HotspotSessionLog[]> {
  const store = await readStore();
  return store.logs.filter((l) => {
    if (l.endedAt) return false;
    if (opts.authUser && l.authUser === opts.authUser) return true;
    if (opts.roomNo && l.roomNo === opts.roomNo) return true;
    return false;
  });
}

export async function closeHotspotSessionsByRoom(roomNo: string, endedAt?: string): Promise<number> {
  const sessions = await findActiveSessions({ roomNo });
  for (const s of sessions) {
    await closeHotspotSession(s.id, endedAt);
  }
  return sessions.length;
}

export async function enrichProvisionedSession(
  authUser: string,
  patch: Partial<Pick<HotspotSessionLog, 'macAddress' | 'internalIp' | 'internalPort' | 'externalIp' | 'externalPort' | 'hotspotZone' | 'bytesIn' | 'bytesOut'>>,
): Promise<HotspotSessionLog | null> {
  const store = await readStore();
  const log = store.logs.find((l) => !l.endedAt && l.authUser === authUser && l.provisioned);
  if (!log) return null;

  if (patch.macAddress && patch.macAddress !== '00:00:00:00:00:00') log.macAddress = patch.macAddress;
  if (patch.internalIp && patch.internalIp !== '0.0.0.0') log.internalIp = patch.internalIp;
  if (patch.internalPort !== undefined) log.internalPort = patch.internalPort;
  if (patch.externalIp) log.externalIp = patch.externalIp;
  if (patch.externalPort !== undefined) log.externalPort = patch.externalPort;
  if (patch.hotspotZone) log.hotspotZone = patch.hotspotZone;
  if (patch.bytesIn !== undefined) log.bytesIn = patch.bytesIn;
  if (patch.bytesOut !== undefined) log.bytesOut = patch.bytesOut;
  log.provisioned = false;
  log.btkCompliant = Boolean(log.internalIp && log.macAddress && log.macAddress !== 'PENDING' && log.startedAt);

  await writeStore(store);
  return log;
}

export async function updateHotspotSession(
  authUser: string,
  patch: Partial<Pick<HotspotSessionLog, 'bytesIn' | 'bytesOut' | 'internalIp' | 'macAddress'>>,
): Promise<HotspotSessionLog | null> {
  const store = await readStore();
  const log = store.logs.find((l) => !l.endedAt && l.authUser === authUser);
  if (!log) return null;
  if (patch.bytesIn !== undefined) log.bytesIn = patch.bytesIn;
  if (patch.bytesOut !== undefined) log.bytesOut = patch.bytesOut;
  if (patch.internalIp) log.internalIp = patch.internalIp;
  if (patch.macAddress) log.macAddress = patch.macAddress;
  await writeStore(store);
  return log;
}

export async function exportBtkBundle(from: string, to: string): Promise<BtkExportBundle> {
  const config = await loadHotspot5651Config();
  const rows = await listHotspotLogs({ from, to, limit: 50_000 });
  const bundle: BtkExportBundle = {
    exportedAt: new Date().toISOString(),
    facilityName: config.facilityName,
    btkRegistrationNo: config.btkRegistrationNo,
    periodFrom: from,
    periodTo: to,
    recordCount: rows.length,
    lawReference: '5651/2007 md.6',
    format: 'btk-csv-v1',
    rows,
  };

  const store = await readStore();
  store.config.lastBtkExportAt = bundle.exportedAt;
  await writeStore(store);
  return bundle;
}

export async function getHotspot5651Stats(): Promise<{
  totalSessions: number;
  activeSessions: number;
  retentionDays: number;
  lastExport: string | null;
  compliantRate: number;
}> {
  const store = await readStore();
  const active = store.logs.filter((l) => !l.endedAt).length;
  const compliant = store.logs.filter((l) => l.btkCompliant).length;
  return {
    totalSessions: store.logs.length,
    activeSessions: active,
    retentionDays: store.config.retentionDays,
    lastExport: store.config.lastBtkExportAt,
    compliantRate: store.logs.length ? Math.round((compliant / store.logs.length) * 100) : 100,
  };
}

export function bundleToBtkCsv(bundle: BtkExportBundle): string {
  const header = [
    'oturum_id',
    'baslangic',
    'bitis',
    'ic_ip',
    'ic_port',
    'dis_ip',
    'dis_port',
    'mac',
    'byte_in',
    'byte_out',
    'misafir',
    'kimlik_tipi',
    'kimlik_maskeli',
    'oda',
    'kaynak',
    'bolge',
    'btk_uyumlu',
  ].join(';');

  const lines = bundle.rows.map((r) =>
    [
      r.id,
      r.startedAt,
      r.endedAt ?? '',
      r.internalIp,
      r.internalPort,
      r.externalIp,
      r.externalPort,
      r.macAddress,
      r.bytesIn,
      r.bytesOut,
      r.guestName,
      r.guestIdType,
      r.guestIdMasked,
      r.roomNo ?? '',
      r.source,
      r.hotspotZone ?? '',
      r.btkCompliant ? '1' : '0',
    ].join(';'),
  );

  return [header, ...lines].join('\n');
}

export async function saveGuestWifiCredential(cred: Omit<GuestWifiCredential, 'createdAt' | 'active'>): Promise<GuestWifiCredential> {
  const store = await readStore();
  if (!store.credentials) store.credentials = [];
  const full: GuestWifiCredential = {
    ...cred,
    createdAt: new Date().toISOString(),
    active: true,
  };
  store.credentials = store.credentials.filter((c) => c.roomNo !== cred.roomNo);
  store.credentials.unshift(full);
  await writeStore(store);
  return full;
}

export async function revokeGuestWifiCredential(roomNo: string): Promise<void> {
  const store = await readStore();
  if (!store.credentials) return;
  for (const c of store.credentials) {
    if (c.roomNo === roomNo) c.active = false;
  }
  await writeStore(store);
}

export async function validateGuestWifiLogin(
  roomNo: string,
  password: string,
): Promise<GuestWifiCredential | null> {
  const store = await readStore();
  const cred = (store.credentials ?? []).find(
    (c) => c.roomNo === roomNo && c.active && c.password === password,
  );
  if (!cred) return null;
  if (new Date(cred.expiresAt).getTime() < Date.now()) return null;
  return cred;
}

export async function getGuestWifiCredential(roomNo: string): Promise<GuestWifiCredential | null> {
  const store = await readStore();
  return (store.credentials ?? []).find((c) => c.roomNo === roomNo && c.active) ?? null;
}

export async function loadHotspot5651Credentials(): Promise<GuestWifiCredential[]> {
  const store = await readStore();
  return store.credentials ?? [];
}
