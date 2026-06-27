import fs from 'node:fs/promises';
import path from 'node:path';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import { ucmLogin, ucmPmsAction } from '@/lib/integrations/pbx/https-api';
import {
  DEFAULT_PBX_CONFIG,
  UCM6301_DEFAULTS,
  UCM_ROOM_STATUS,
  type PbxActionResult,
  type PbxConfig,
  type PbxGuestRequest,
  type UcmRoomStatus,
} from '@/lib/integrations/pbx/types';

const CONFIG_FILE = process.env.ROOMIO_PBX_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'pbx-config.json');

export async function loadPbxConfig(): Promise<PbxConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_PBX_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PBX_CONFIG;
  }
}

export async function savePbxConfig(config: PbxConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

export function mapExtension(roomNo: string, mappings: Record<string, string>): string {
  return mappings[roomNo] ?? roomNo;
}

function splitGuestName(name: string): { firstname: string; lastname: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstname: parts[0] ?? 'Misafir', lastname: '-' };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

function formatPmsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.replace(/-/g, '').slice(0, 8);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function withSession(
  config: PbxConfig,
  fn: (cookie: string) => Promise<PbxActionResult>,
): Promise<PbxActionResult> {
  if (!config.enabled) return { ok: false, message: 'Santral entegrasyonu kapalı' };
  if (!config.host?.trim()) return { ok: false, message: 'UCM IP adresi tanımlı değil' };

  try {
    const login = await ucmLogin(
      config.host,
      config.port,
      config.apiUsername,
      config.apiPassword,
      UCM6301_DEFAULTS.apiVersion,
      UCM6301_DEFAULTS.timeoutMs,
    );
    if (!login.ok || !login.cookie) {
      if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
        return { ok: true, simulated: true, message: 'Simülasyon — UCM API oturumu açılamadı' };
      }
      return { ok: false, message: login.message, rawResponse: login.raw };
    }
    return fn(login.cookie);
  } catch (e) {
    if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return { ok: true, simulated: true, message: 'Simülasyon — UCM6301 erişilemedi' };
    }
    return { ok: false, message: e instanceof Error ? e.message : 'UCM bağlantı hatası' };
  }
}

export async function testPbxConnection(config = DEFAULT_PBX_CONFIG): Promise<PbxActionResult> {
  return withSession(config, async (cookie) => {
    const ping = await ucmPmsAction(
      config.host,
      config.port,
      cookie,
      config.pmsUsername,
      config.pmsPassword,
      { query: { room: mapExtension('101', config.extensionMappings) } },
      UCM6301_DEFAULTS.timeoutMs,
    );
    return {
      ok: ping.ok,
      message: ping.ok
        ? `${config.model} (${config.host}:${config.port}) bağlantısı OK`
        : ping.message,
      rawResponse: ping.raw,
    };
  });
}

export async function pbxCheckIn(req: PbxGuestRequest, config?: PbxConfig): Promise<PbxActionResult> {
  const cfg = config ?? (await loadPbxConfig());
  const ext = mapExtension(req.roomNo, cfg.extensionMappings);
  const { firstname, lastname } = splitGuestName(req.guestName);
  const payload = {
    checkin: {
      address: ext,
      room: ext,
      account: ext,
      firstname,
      lastname,
      language: req.language ?? 'tr',
      vipcode: req.vipCode ?? '',
      datein: formatPmsDate(req.checkIn),
      dateout: formatPmsDate(req.checkOut),
      cos: cfg.enableExtensionOnCheckIn ? '1' : '4',
    },
  };

  return withSession(cfg, async (cookie) => {
    const result = await ucmPmsAction(
      cfg.host,
      cfg.port,
      cookie,
      cfg.pmsUsername,
      cfg.pmsPassword,
      payload,
      UCM6301_DEFAULTS.timeoutMs,
    );
    if (result.ok && cfg.syncDisplayName) {
      await ucmPmsAction(
        cfg.host,
        cfg.port,
        cookie,
        cfg.pmsUsername,
        cfg.pmsPassword,
        { update: { address: ext, room: ext, account: ext, status: UCM_ROOM_STATUS.vacant } },
        UCM6301_DEFAULTS.timeoutMs,
      );
    }
    return {
      ok: result.ok,
      message: result.ok
        ? `Santral check-in — Oda ${req.roomNo} (ext ${ext})`
        : result.message,
      rawRequest: JSON.stringify(payload),
      rawResponse: result.raw,
    };
  });
}

export async function pbxCheckOut(roomNo: string, config?: PbxConfig): Promise<PbxActionResult> {
  const cfg = config ?? (await loadPbxConfig());
  const ext = mapExtension(roomNo, cfg.extensionMappings);
  const payload = { checkout: { address: ext, room: ext, account: ext } };

  return withSession(cfg, async (cookie) => {
    const result = await ucmPmsAction(
      cfg.host,
      cfg.port,
      cookie,
      cfg.pmsUsername,
      cfg.pmsPassword,
      payload,
      UCM6301_DEFAULTS.timeoutMs,
    );
    return {
      ok: result.ok,
      message: result.ok ? `Santral check-out — Oda ${roomNo}` : result.message,
      rawRequest: JSON.stringify(payload),
      rawResponse: result.raw,
    };
  });
}

export async function pbxUpdateRoomStatus(
  roomNo: string,
  status: UcmRoomStatus,
  config?: PbxConfig,
): Promise<PbxActionResult> {
  const cfg = config ?? (await loadPbxConfig());
  const ext = mapExtension(roomNo, cfg.extensionMappings);
  const payload = {
    update: {
      address: ext,
      room: ext,
      account: ext,
      status: UCM_ROOM_STATUS[status],
    },
  };

  return withSession(cfg, async (cookie) => {
    const result = await ucmPmsAction(
      cfg.host,
      cfg.port,
      cookie,
      cfg.pmsUsername,
      cfg.pmsPassword,
      payload,
      UCM6301_DEFAULTS.timeoutMs,
    );
    return {
      ok: result.ok,
      message: result.ok ? `Oda ${roomNo} durumu → ${status}` : result.message,
      rawRequest: JSON.stringify(payload),
      rawResponse: result.raw,
    };
  });
}
