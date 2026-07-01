import type { DeviceTestResult, MikrotikDeviceConfig } from '@/lib/integrations/hotspot5651/types';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';

export type MikrotikActiveSession = {
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
};

function baseUrl(cfg: MikrotikDeviceConfig): string {
  const proto = cfg.useHttps ? 'https' : 'http';
  const port = cfg.restPort === (cfg.useHttps ? 443 : 80) ? '' : `:${cfg.restPort}`;
  return `${proto}://${cfg.host}${port}/rest`;
}

async function mikrotikFetch<T>(
  cfg: MikrotikDeviceConfig,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string; offline?: boolean }> {
  cfg = { ...cfg, simulateWhenOffline: effectiveSimulateWhenOffline(cfg.simulateWhenOffline) };
  const auth = Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64');
  const controller = new AbortController();
  const timeoutMs = cfg.simulateWhenOffline ? 1500 : 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl(cfg)}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
    }
    if (res.status === 204) return { ok: true };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
    return { ok: false, error: msg, offline: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function testMikrotikConnection(cfg: MikrotikDeviceConfig): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'mikrotik', message: 'MikroTik entegrasyonu kapalı' };

  const res = await mikrotikFetch<{ name: string; version: string }[]>(cfg, '/system/resource');
  if (res.ok && res.data) {
    const resource = Array.isArray(res.data) ? res.data[0] : res.data;
    return {
      ok: true,
      device: 'mikrotik',
      message: `MikroTik ${cfg.model} bağlantısı OK — ${cfg.host}`,
      details: { version: resource?.version, role: cfg.role, model: cfg.model, board: resource?.name },
    };
  }
  if (cfg.simulateWhenOffline && res.offline) {
    return {
      ok: true,
      device: 'mikrotik',
      simulated: true,
      message: `Simülasyon — ${cfg.model} (${cfg.host})`,
      details: { hotspotServer: cfg.hotspotServer, model: cfg.model },
    };
  }
  return { ok: false, device: 'mikrotik', message: res.error ?? 'MikroTik bağlantı hatası' };
}

export async function listMikrotikActiveSessions(cfg: MikrotikDeviceConfig): Promise<MikrotikActiveSession[]> {
  const res = await mikrotikFetch<Array<Record<string, string>>>(cfg, '/ip/hotspot/active');
  if (!res.ok || !res.data) {
    if (cfg.simulateWhenOffline && res.offline) {
      return [
        {
          user: 'room412',
          address: '10.10.42.118',
          macAddress: 'AA:BB:CC:11:22:33',
          uptime: '1h',
          bytesIn: 45_000_000,
          bytesOut: 8_000_000,
        },
      ];
    }
    return [];
  }
  return res.data.map((row) => ({
    user: row.user ?? row.name ?? '',
    address: row.address ?? '0.0.0.0',
    macAddress: (row['mac-address'] ?? row.mac ?? '').toUpperCase(),
    uptime: row.uptime ?? '',
    bytesIn: Number(row['bytes-in'] ?? row.bytesIn ?? 0),
    bytesOut: Number(row['bytes-out'] ?? row.bytesOut ?? 0),
  }));
}

export async function addMikrotikHotspotUser(
  cfg: MikrotikDeviceConfig,
  authUser: string,
  password: string,
  comment: string,
  limitUptime?: string,
): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'mikrotik', message: 'MikroTik kapalı' };

  const body = {
    name: authUser,
    password,
    profile: cfg.hotspotProfile,
    server: cfg.hotspotServer,
    comment,
    ...(limitUptime ? { 'limit-uptime': limitUptime } : {}),
  };

  const res = await mikrotikFetch(cfg, '/ip/hotspot/user', { method: 'PUT', body: JSON.stringify(body) });
  if (res.ok) {
    return { ok: true, device: 'mikrotik', message: `Hotspot kullanıcısı oluşturuldu: ${authUser}` };
  }
  if (cfg.simulateWhenOffline && res.offline) {
    return { ok: true, device: 'mikrotik', simulated: true, message: `Simülasyon — ${authUser} MikroTik'e yazıldı` };
  }
  return { ok: false, device: 'mikrotik', message: res.error ?? 'Kullanıcı eklenemedi' };
}

export async function removeMikrotikHotspotUser(cfg: MikrotikDeviceConfig, authUser: string): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'mikrotik', message: 'MikroTik kapalı' };

  const list = await mikrotikFetch<Array<{ '.id': string; name: string }>>(
    cfg,
    `/ip/hotspot/user?name=${encodeURIComponent(authUser)}`,
  );
  if (!list.ok || !list.data?.length) {
    if (cfg.simulateWhenOffline && list.offline) {
      return { ok: true, device: 'mikrotik', simulated: true, message: `Simülasyon — ${authUser} silindi` };
    }
    return { ok: true, device: 'mikrotik', message: 'Kullanıcı zaten yok' };
  }

  const id = list.data[0]['.id'];
  const del = await mikrotikFetch(cfg, `/ip/hotspot/user/${id}`, { method: 'DELETE' });
  if (del.ok) return { ok: true, device: 'mikrotik', message: `${authUser} hotspot'tan kaldırıldı` };
  if (cfg.simulateWhenOffline && del.offline) {
    return { ok: true, device: 'mikrotik', simulated: true, message: `Simülasyon — ${authUser} kaldırıldı` };
  }
  return { ok: false, device: 'mikrotik', message: del.error ?? 'Silinemedi' };
}

export async function disconnectMikrotikActiveUser(cfg: MikrotikDeviceConfig, authUser: string): Promise<DeviceTestResult> {
  const active = await listMikrotikActiveSessions(cfg);
  const session = active.find((s) => s.user === authUser);
  if (!session) return { ok: true, device: 'mikrotik', message: 'Aktif oturum yok' };

  const list = await mikrotikFetch<Array<{ '.id': string }>>(cfg, `/ip/hotspot/active?user=${encodeURIComponent(authUser)}`);
  if (list.ok && list.data?.[0]) {
    await mikrotikFetch(cfg, `/ip/hotspot/active/${list.data[0]['.id']}`, { method: 'DELETE' });
  }
  return { ok: true, device: 'mikrotik', message: `${authUser} oturumu sonlandırıldı` };
}

export function mikrotikSyslogScript(roomioHost: string, port = 5514): string {
  return `/system logging action
add name=roomio5651 target=remote remote=${roomioHost} remote-port=${port} bsd-syslog=no syslog-facility=local0 syslog-severity=info

/system logging
add topics=hotspot,info action=roomio5651
add topics=account,info action=roomio5651`;
}

export function mikrotikHotspotUserScript(profile: string, server: string, sharedUsers = 5): string {
  return `/ip hotspot user profile
:if ([:len [/ip hotspot user profile find name="${profile}"]] = 0) do={
  add name="${profile}" rate-limit=20M/20M shared-users=${sharedUsers}
} else={
  set [/ip hotspot user profile find name="${profile}"] shared-users=${sharedUsers}
}

/ip hotspot
:if ([:len [/ip hotspot find name="${server}"]] = 0) do={
  add name="${server}" interface=bridge-lan address-pool=roomio-guest profile="${profile}"
}`;
}

/** RB5009UG+S+IN — otel topolojisi: ether1 WAN, ether2-7 LAN/AP, VLAN50 misafir */
export function mikrotikRb5009SetupScript(opts: {
  roomioSyslogHost: string;
  roomioPortalHost: string;
  syslogPort?: number;
  hotspotServer: string;
  hotspotProfile: string;
  guestVlan?: number;
  /** Tek misafir bilgisiyle eşzamanlı bağlanabilecek maksimum cihaz sayısı (varsayılan 5) */
  maxDevicesPerUser?: number;
}): string {
  const vlan = opts.guestVlan ?? 50;
  const port = opts.syslogPort ?? 5514;
  const sharedUsers = opts.maxDevicesPerUser ?? 5;
  return `# Roomio — MikroTik RB5009UG+S+IN otel şablonu
# ether1: ISP/WAN  |  ether2-7: UniFi AP trunk  |  sfp-sfpplus1: uplink (opsiyonel)

/interface bridge
:if ([:len [find name="bridge-lan"]] = 0) do={ add name=bridge-lan vlan-filtering=yes }
:if ([:len [find name="bridge-guest"]] = 0) do={ add name=bridge-guest }

/interface vlan
:if ([:len [find name="vlan${vlan}-guest"]] = 0) do={
  add name=vlan${vlan}-guest vlan-id=${vlan} interface=bridge-lan
}

/interface bridge port
# UniFi AP'ler ether2-7'ye bağlı (PoE switch veya doğrudan)
:foreach p in={ether2;ether3;ether4;ether5;ether6;ether7} do={
  :if ([:len [find interface=$p]] = 0) do={ add bridge=bridge-lan interface=$p }
}

/ip pool
:if ([:len [find name="roomio-guest"]] = 0) do={
  add name=roomio-guest ranges=10.10.${vlan}.10-10.10.${vlan}.250
}

/ip hotspot profile
:if ([:len [find name="${opts.hotspotProfile}"]] = 0) do={
  add name=${opts.hotspotProfile} hotspot-address=10.10.${vlan}.1 dns-name=wifi.hotelsapphire.local rate-limit=50M/50M
}

# 1 misafir bilgisiyle (oda no) eşzamanlı en fazla ${sharedUsers} cihaz bağlanabilir
/ip hotspot user profile
:if ([:len [find name="${opts.hotspotProfile}"]] = 0) do={
  add name=${opts.hotspotProfile} rate-limit=20M/20M shared-users=${sharedUsers}
} else={
  set [find name="${opts.hotspotProfile}"] shared-users=${sharedUsers}
}

/ip hotspot
:if ([:len [find name="${opts.hotspotServer}"]] = 0) do={
  add name=${opts.hotspotServer} interface=vlan${vlan}-guest address-pool=roomio-guest profile=${opts.hotspotProfile}
}

# Captive portal — Roomio misafir login
/ip hotspot profile
set [find name="${opts.hotspotProfile}"] login-by=http-chap,http-pap html-directory=hotspot http-proxy=0.0.0.0:0

/ip hotspot walled-garden
:if ([:len [find dst-host~"${opts.roomioPortalHost}"]] = 0) do={
  add dst-host=${opts.roomioPortalHost} action=allow comment="Roomio captive portal"
}

${mikrotikSyslogScript(opts.roomioSyslogHost, port)}`;
}
