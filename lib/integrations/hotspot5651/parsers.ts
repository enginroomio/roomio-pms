import type { Hotspot5651Config, HotspotSessionLog } from '@/lib/integrations/hotspot5651/types';

export type ParsedBridgeEvent = {
  action: 'start' | 'stop' | 'update';
  authUser?: string;
  macAddress?: string;
  internalIp?: string;
  internalPort?: number;
  externalIp?: string;
  externalPort?: number;
  bytesIn?: number;
  bytesOut?: number;
  hotspotZone?: string;
  guestName?: string;
  startedAt?: string;
  endedAt?: string;
};

const MAC_RE = /(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

function pickMac(text: string): string | undefined {
  return text.match(MAC_RE)?.[0]?.toUpperCase().replace(/-/g, ':');
}

function pickIp(text: string): string | undefined {
  return text.match(IP_RE)?.[0];
}

/** MikroTik hotspot / RADIUS syslog örneği */
export function parseMikrotikSyslog(line: string): ParsedBridgeEvent | null {
  const lower = line.toLowerCase();
  const mac = pickMac(line);
  const ip = pickIp(line);

  const userMatch = line.match(/user[=:]\s*"?([^",\s]+)"?/i)
    ?? line.match(/username[=:]\s*"?([^",\s]+)"?/i);
  const authUser = userMatch?.[1];

  if (lower.includes('logged out') || lower.includes('logout') || lower.includes('disconnected')) {
    return { action: 'stop', authUser, macAddress: mac, internalIp: ip, endedAt: new Date().toISOString() };
  }
  if (lower.includes('logged in') || lower.includes('login') || lower.includes('connected')) {
    return {
      action: 'start',
      authUser,
      macAddress: mac ?? '00:00:00:00:00:00',
      internalIp: ip ?? '0.0.0.0',
      internalPort: 0,
      externalIp: '0.0.0.0',
      externalPort: 0,
      hotspotZone: 'MikroTik',
      startedAt: new Date().toISOString(),
    };
  }
  if (mac && (lower.includes('bytes') || lower.includes('acct'))) {
    const inMatch = line.match(/bytes[_-]?in[=:\s]+(\d+)/i);
    const outMatch = line.match(/bytes[_-]?out[=:\s]+(\d+)/i);
    return {
      action: 'update',
      authUser,
      macAddress: mac,
      internalIp: ip,
      bytesIn: inMatch ? Number(inMatch[1]) : undefined,
      bytesOut: outMatch ? Number(outMatch[1]) : undefined,
    };
  }
  return null;
}

/** UniFi guest / UDM syslog */
export function parseUnifiSyslog(line: string): ParsedBridgeEvent | null {
  const lower = line.toLowerCase();
  const mac = pickMac(line);
  const ip = pickIp(line);
  const guestMatch = line.match(/guest[_\s]?name[=:]\s*"?([^",]+)"?/i)
    ?? line.match(/user[=:]\s*"?([^",\s]+)"?/i);
  const authUser = guestMatch?.[1];

  if (lower.includes('guest authorized') || lower.includes('wifi connected')) {
    return {
      action: 'start',
      authUser,
      macAddress: mac ?? '00:00:00:00:00:00',
      internalIp: ip ?? '0.0.0.0',
      internalPort: 0,
      externalIp: '0.0.0.0',
      externalPort: 0,
      hotspotZone: 'UniFi-Guest',
      startedAt: new Date().toISOString(),
    };
  }
  if (lower.includes('guest deauth') || lower.includes('wifi disconnected')) {
    return { action: 'stop', authUser, macAddress: mac, internalIp: ip, endedAt: new Date().toISOString() };
  }
  return parseMikrotikSyslog(line);
}

/** RADIUS Accounting-Start / Stop JSON (FreeRADIUS, MikroTik REST) */
export function parseRadiusAccounting(body: Record<string, unknown>): ParsedBridgeEvent | null {
  const status = String(body.Acct_Status_Type ?? body.status ?? '').toLowerCase();
  const authUser = String(body.User_Name ?? body.username ?? body.user ?? '');
  const mac = String(body.Calling_Station_Id ?? body.mac ?? '');
  const ip = String(body.Framed_IP_Address ?? body.framed_ip ?? body.ip ?? '');

  if (!authUser) return null;

  if (status.includes('start') || status === '1') {
    return {
      action: 'start',
      authUser,
      macAddress: pickMac(mac) ?? mac,
      internalIp: pickIp(ip) ?? ip,
      internalPort: Number(body.NAS_Port ?? 0),
      externalIp: String(body.NAS_IP_Address ?? '0.0.0.0'),
      externalPort: 0,
      hotspotZone: String(body.NAS_Identifier ?? 'RADIUS'),
      startedAt: new Date().toISOString(),
    };
  }
  if (status.includes('stop') || status === '2') {
    return {
      action: 'stop',
      authUser,
      macAddress: pickMac(mac) ?? mac,
      internalIp: pickIp(ip) ?? ip,
      endedAt: new Date().toISOString(),
      bytesIn: Number(body.Acct_Input_Octets ?? body.bytes_in ?? 0),
      bytesOut: Number(body.Acct_Output_Octets ?? body.bytes_out ?? 0),
    };
  }
  if (status.includes('interim') || status === '3') {
    return {
      action: 'update',
      authUser,
      macAddress: pickMac(mac) ?? mac,
      internalIp: pickIp(ip) ?? ip,
      bytesIn: Number(body.Acct_Input_Octets ?? 0),
      bytesOut: Number(body.Acct_Output_Octets ?? 0),
    };
  }
  return null;
}

export function parseBridgePayload(
  provider: Hotspot5651Config['provider'],
  payload: { line?: string; radius?: Record<string, unknown>; format?: string },
): ParsedBridgeEvent | null {
  if (payload.radius) return parseRadiusAccounting(payload.radius);
  if (!payload.line) return null;
  if (provider === 'unifi') return parseUnifiSyslog(payload.line);
  return parseMikrotikSyslog(payload.line);
}

export const SAMPLE_SYSLOG_LINES: Record<string, string> = {
  mikrotik_login: '<hotspot> user=room412 logged in 10.10.42.118 AA:BB:CC:11:22:33',
  mikrotik_logout: '<hotspot> user=room412 logged out 10.10.42.118 AA:BB:CC:11:22:33',
  unifi_connect: 'wifi connected guest_name=room305 mac=DE:AD:BE:EF:00:01 ip=10.10.42.205',
};

export function eventToLogFields(
  event: ParsedBridgeEvent,
  source: HotspotSessionLog['source'],
): Omit<HotspotSessionLog, 'id' | 'createdAt' | 'guestIdMasked' | 'btkCompliant'> & { guestIdRaw?: string } | null {
  if (event.action === 'stop') return null;
  return {
    startedAt: event.startedAt ?? new Date().toISOString(),
    endedAt: null,
    internalIp: event.internalIp ?? '0.0.0.0',
    internalPort: event.internalPort ?? 0,
    externalIp: event.externalIp ?? '0.0.0.0',
    externalPort: event.externalPort ?? 0,
    macAddress: event.macAddress ?? '00:00:00:00:00:00',
    bytesIn: event.bytesIn ?? 0,
    bytesOut: event.bytesOut ?? 0,
    guestName: event.guestName ?? event.authUser ?? 'Misafir',
    guestIdType: 'room_guest',
    guestIdRaw: event.authUser,
    roomNo: authUserToRoom(event.authUser),
    reservationId: null,
    authUser: event.authUser ?? null,
    source,
    userAgent: null,
    hotspotZone: event.hotspotZone ?? null,
    provisioned: false,
  };
}

export function authUserToRoom(authUser?: string): string | null {
  if (!authUser) return null;
  const m = authUser.match(/^room(\d+)$/i);
  return m ? m[1] : null;
}

export function roomToAuthUser(roomNo: string): string {
  return `room${roomNo}`;
}
