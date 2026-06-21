import type { DeviceTestResult, UnifiDeviceConfig } from '@/lib/integrations/hotspot5651/types';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';

export type UnifiStation = {
  mac: string;
  hostname: string;
  ip: string;
  essid: string;
  vlan: number;
  isGuest: boolean;
  txBytes: number;
  rxBytes: number;
  authorized: boolean;
};

type UnifiLoginCookies = { cookies: string };

async function unifiLogin(cfg: UnifiDeviceConfig): Promise<UnifiLoginCookies | null> {
  cfg = { ...cfg, simulateWhenOffline: effectiveSimulateWhenOffline(cfg.simulateWhenOffline) };
  const controller = new AbortController();
  const timeoutMs = cfg.simulateWhenOffline ? 1500 : 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${cfg.controllerUrl.replace(/\/$/, '')}/api/login`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cfg.username, password: cfg.password }),
    });
    if (!res.ok) return null;
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const cookies = setCookie.map((c) => c.split(';')[0]).join('; ');
    return cookies ? { cookies } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function unifiFetch<T>(
  cfg: UnifiDeviceConfig,
  path: string,
  init?: RequestInit & { cookies?: string },
): Promise<{ ok: boolean; data?: T; error?: string; offline?: boolean }> {
  cfg = { ...cfg, simulateWhenOffline: effectiveSimulateWhenOffline(cfg.simulateWhenOffline) };
  const controller = new AbortController();
  const timeoutMs = cfg.simulateWhenOffline ? 1500 : 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const base = cfg.controllerUrl.replace(/\/$/, '');
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.cookies ? { Cookie: init.cookies } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { meta?: { rc: string }; data?: T };
    if (json.meta?.rc && json.meta.rc !== 'ok') {
      return { ok: false, error: `UniFi: ${json.meta.rc}` };
    }
    return { ok: true, data: json.data ?? (json as T) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bağlantı hatası', offline: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function testUnifiConnection(cfg: UnifiDeviceConfig): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'unifi', message: 'UniFi entegrasyonu kapalı' };

  const login = await unifiLogin(cfg);
  if (!login) {
    if (cfg.simulateWhenOffline) {
      return {
        ok: true,
        device: 'unifi',
        simulated: true,
        message: `Simülasyon — ${cfg.label} (${cfg.apCount} AP)`,
        details: { site: cfg.siteId, wlan: cfg.guestWlan },
      };
    }
    return { ok: false, device: 'unifi', message: 'UniFi Controller girişi başarısız' };
  }

  const sites = await unifiFetch<Array<{ name: string; desc: string }>>(
    cfg,
    `/api/s/${cfg.siteId}/self`,
    { cookies: login.cookies },
  );
  if (sites.ok) {
    return {
      ok: true,
      device: 'unifi',
      message: `UniFi Controller OK — site: ${cfg.siteId}`,
      details: { guestWlan: cfg.guestWlan, vlan: cfg.guestVlan },
    };
  }
  return { ok: false, device: 'unifi', message: sites.error ?? 'Site erişim hatası' };
}

export async function listUnifiGuestStations(cfg: UnifiDeviceConfig): Promise<UnifiStation[]> {
  const login = await unifiLogin(cfg);
  if (!login) {
    if (cfg.simulateWhenOffline) {
      return [
        {
          mac: 'DE:AD:BE:EF:00:01',
          hostname: 'room305',
          ip: '10.10.42.205',
          essid: cfg.guestWlan,
          vlan: cfg.guestVlan,
          isGuest: true,
          txBytes: 22_000_000,
          rxBytes: 120_000_000,
          authorized: true,
        },
      ];
    }
    return [];
  }

  const res = await unifiFetch<Array<Record<string, unknown>>>(
    cfg,
    `/api/s/${cfg.siteId}/stat/sta`,
    { cookies: login.cookies },
  );
  if (!res.ok || !res.data) return [];

  return res.data
    .filter((sta) => {
      const essid = String(sta.essid ?? '');
      const vlan = Number(sta.vlan ?? 0);
      return essid === cfg.guestWlan || vlan === cfg.guestVlan || Boolean(sta.is_guest);
    })
    .map((sta) => ({
      mac: String(sta.mac ?? '').toUpperCase(),
      hostname: String(sta.hostname ?? sta.name ?? sta.essid ?? ''),
      ip: String(sta.ip ?? '0.0.0.0'),
      essid: String(sta.essid ?? ''),
      vlan: Number(sta.vlan ?? 0),
      isGuest: Boolean(sta.is_guest),
      txBytes: Number(sta['tx_bytes'] ?? 0),
      rxBytes: Number(sta['rx_bytes'] ?? 0),
      authorized: Boolean(sta.authorized),
    }));
}

export async function authorizeUnifiGuest(
  cfg: UnifiDeviceConfig,
  mac: string,
  minutes: number,
): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'unifi', message: 'UniFi kapalı' };

  const login = await unifiLogin(cfg);
  if (!login) {
    if (cfg.simulateWhenOffline) {
      return { ok: true, device: 'unifi', simulated: true, message: `Simülasyon — ${mac} misafir yetkisi` };
    }
    return { ok: false, device: 'unifi', message: 'Controller erişilemiyor' };
  }

  const res = await unifiFetch(
    cfg,
    `/api/s/${cfg.siteId}/cmd/stamgr`,
    {
      method: 'POST',
      cookies: login.cookies,
      body: JSON.stringify({ cmd: 'authorize-guest', mac: mac.toLowerCase(), minutes }),
    },
  );
  if (res.ok) return { ok: true, device: 'unifi', message: `${mac} misafir ağına yetkilendirildi` };
  if (cfg.simulateWhenOffline) {
    return { ok: true, device: 'unifi', simulated: true, message: `Simülasyon — ${mac} yetkilendirildi` };
  }
  return { ok: false, device: 'unifi', message: res.error ?? 'Yetkilendirme hatası' };
}

export async function unauthorizeUnifiGuest(cfg: UnifiDeviceConfig, mac: string): Promise<DeviceTestResult> {
  if (!cfg.enabled) return { ok: false, device: 'unifi', message: 'UniFi kapalı' };

  const login = await unifiLogin(cfg);
  if (!login) {
    if (cfg.simulateWhenOffline) {
      return { ok: true, device: 'unifi', simulated: true, message: `Simülasyon — ${mac} yetkisi kaldırıldı` };
    }
    return { ok: false, device: 'unifi', message: 'Controller erişilemiyor' };
  }

  const res = await unifiFetch(
    cfg,
    `/api/s/${cfg.siteId}/cmd/stamgr`,
    {
      method: 'POST',
      cookies: login.cookies,
      body: JSON.stringify({ cmd: 'unauthorize-guest', mac: mac.toLowerCase() }),
    },
  );
  if (res.ok) return { ok: true, device: 'unifi', message: `${mac} misafir yetkisi kaldırıldı` };
  if (cfg.simulateWhenOffline) {
    return { ok: true, device: 'unifi', simulated: true, message: `Simülasyon — ${mac} kaldırıldı` };
  }
  return { ok: false, device: 'unifi', message: res.error ?? 'İşlem hatası' };
}

export async function listUnifiAccessPoints(cfg: UnifiDeviceConfig): Promise<Array<{ name: string; mac: string; model: string; state: number }>> {
  const login = await unifiLogin(cfg);
  if (!login) {
    if (cfg.simulateWhenOffline) {
      return [
        { name: 'AP-Lobby', mac: 'AC:8B:A9:00:01:01', model: 'U6-Pro', state: 1 },
        { name: 'AP-Floor-3', mac: 'AC:8B:A9:00:01:02', model: 'U6-Lite', state: 1 },
      ];
    }
    return [];
  }

  const res = await unifiFetch<Array<Record<string, unknown>>>(
    cfg,
    `/api/s/${cfg.siteId}/stat/device`,
    { cookies: login.cookies },
  );
  if (!res.ok || !res.data) return [];

  return res.data
    .filter((d) => String(d.type ?? '') === 'uap' || String(d.model ?? '').includes('U'))
    .map((d) => ({
      name: String(d.name ?? 'AP'),
      mac: String(d.mac ?? '').toUpperCase(),
      model: String(d.model ?? ''),
      state: Number(d.state ?? 0),
    }));
}

export function unifiSyslogInstructions(roomioHost: string, port = 5514): string {
  return `UniFi Network → Settings → Control Plane → Integrations → Syslog
Remote syslog server: ${roomioHost}:${port}
Facility: local0
Include: WiFi / Guest clients

Alternatif (self-hosted controller):
Settings → System → Remote Logging → Enable
Host: ${roomioHost}  Port: ${port}`;
}
