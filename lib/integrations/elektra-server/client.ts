import fs from 'node:fs/promises';
import path from 'node:path';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import {
  DEFAULT_ELEKTRA_SERVER_CONFIG,
  ELEKTRA_SERVER_DEFAULTS,
  type ElektraActionResult,
  type ElektraServerConfig,
} from '@/lib/integrations/elektra-server/types';

const CONFIG_FILE = process.env.ROOMIO_ELEKTRA_SERVER_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'elektra-server-config.json');

export async function loadElektraServerConfig(): Promise<ElektraServerConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ElektraServerConfig>;
    return {
      ...DEFAULT_ELEKTRA_SERVER_CONFIG,
      ...parsed,
      relayServices: {
        ...DEFAULT_ELEKTRA_SERVER_CONFIG.relayServices,
        ...parsed.relayServices,
      },
    };
  } catch {
    return DEFAULT_ELEKTRA_SERVER_CONFIG;
  }
}

export async function saveElektraServerConfig(config: ElektraServerConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

export function elektraServerBaseUrl(config: ElektraServerConfig): string {
  const scheme = config.useHttps ? 'https' : 'http';
  return `${scheme}://${config.host}:${config.port}${ELEKTRA_SERVER_DEFAULTS.apiPath}`;
}

export function isElektraRelayEnabled(
  config: ElektraServerConfig,
  service: keyof ElektraServerConfig['relayServices'],
): boolean {
  return config.enabled && config.host.trim().length > 0 && config.relayServices[service];
}

export async function callElektraService(
  service: string,
  action: string,
  payload: Record<string, unknown>,
  config?: ElektraServerConfig,
): Promise<ElektraActionResult> {
  const cfg = config ?? (await loadElektraServerConfig());
  if (!cfg.enabled) {
    return { ok: false, message: 'Elektra v5 sunucu köprüsü kapalı' };
  }
  if (!cfg.host?.trim()) {
    return { ok: false, message: 'Elektra sunucu adresi tanımlı değil' };
  }

  const url = `${elektraServerBaseUrl(cfg)}/${service}/${action}`;
  const body = {
    hotelCode: cfg.hotelCode,
    ...payload,
  };
  const rawRequest = JSON.stringify(body);

  try {
    const auth = Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: rawRequest,
      signal: AbortSignal.timeout(ELEKTRA_SERVER_DEFAULTS.timeoutMs),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
        return {
          ok: true,
          simulated: true,
          message: `Simülasyon — Elektra ${service}/${action} (${res.status})`,
          rawRequest,
          rawResponse: raw.slice(0, 500),
        };
      }
      return {
        ok: false,
        message: `Elektra sunucu HTTP ${res.status}`,
        rawRequest,
        rawResponse: raw.slice(0, 500),
      };
    }

    let message = 'Elektra sunucu yanıtı OK';
    try {
      const parsed = JSON.parse(raw) as { ok?: boolean; message?: string };
      if (parsed.message) message = parsed.message;
      if (parsed.ok === false) {
        return { ok: false, message, rawRequest, rawResponse: raw.slice(0, 500) };
      }
    } catch {
      /* plain text */
    }

    return { ok: true, message, rawRequest, rawResponse: raw.slice(0, 500) };
  } catch (e) {
    if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
      return {
        ok: true,
        simulated: true,
        message: `Simülasyon — Elektra sunucuya ulaşılamadı (${service}/${action})`,
        rawRequest,
      };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Elektra sunucu bağlantı hatası',
      rawRequest,
    };
  }
}

export async function testElektraServerConnection(
  config = DEFAULT_ELEKTRA_SERVER_CONFIG,
): Promise<ElektraActionResult> {
  return callElektraService('ping', 'connect', { at: new Date().toISOString() }, config);
}
