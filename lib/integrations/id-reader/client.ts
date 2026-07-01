import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { validateIdScanDocument } from '@/lib/integrations/id-reader/validate';
import {
  DEFAULT_ID_READER_CONFIG,
  type IdReaderConfig,
  type IdScanDocument,
  type IdScanResult,
  type KimlikokurGatewayScanResponse,
} from '@/lib/integrations/id-reader/types';

const FILE = 'id-reader-config.json';

function gatewayBaseUrl(): string {
  return process.env.ROOMIO_ID_READER_GATEWAY_URL?.trim().replace(/\/$/, '') ?? '';
}

function scanEndpoint(): string {
  const base = gatewayBaseUrl();
  if (!base) return '';
  return base.endsWith('/scan') ? base : `${base}/scan`;
}

function demoDocument(): IdScanDocument {
  return {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    nationality: 'TR',
    documentNo: '10000000146',
    idType: 'TCKN',
    birthDate: '1985-04-12',
    birthPlace: 'İstanbul',
    gender: 'E',
    fatherName: 'Mehmet',
    motherName: 'Ayşe',
    confidence: 0.96,
  };
}

function normalizeGatewayDocument(raw: Partial<IdScanDocument>): IdScanDocument {
  const documentNo = String(raw.documentNo ?? '').trim();
  return {
    firstName: String(raw.firstName ?? '').trim(),
    lastName: String(raw.lastName ?? '').trim(),
    nationality: String(raw.nationality ?? 'TR').trim().toUpperCase(),
    documentNo,
    idType: raw.idType,
    birthDate: String(raw.birthDate ?? '').slice(0, 10),
    birthPlace: raw.birthPlace?.trim(),
    gender: raw.gender,
    fatherName: raw.fatherName?.trim(),
    motherName: raw.motherName?.trim(),
    issueDate: raw.issueDate,
    expiryDate: raw.expiryDate,
    mrz: raw.mrz,
    confidence: raw.confidence,
    documentImageBase64: raw.documentImageBase64,
  };
}

async function scanViaKimlikokurGateway(
  device: IdReaderConfig['devices'][number],
  reservationId?: string,
): Promise<IdScanResult> {
  const url = scanEndpoint();
  if (!url) {
    return { ok: false, message: 'ROOMIO_ID_READER_GATEWAY_URL tanımlı değil' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(process.env.ROOMIO_ID_READER_API_KEY
          ? { Authorization: `Bearer ${process.env.ROOMIO_ID_READER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        deviceId: device.id,
        deviceName: device.name,
        connection: device.connection,
        host: device.host,
        reservationId,
        vendor: 'kimlikokur',
      }),
    });

    const payload = (await res.json()) as KimlikokurGatewayScanResponse;
    if (!res.ok || !payload.ok || !payload.document) {
      return {
        ok: false,
        message: payload.message ?? `Kimlikokur gateway HTTP ${res.status}`,
      };
    }

    const data = normalizeGatewayDocument(
      { ...payload.document, confidence: payload.confidence ?? payload.document.confidence },
    );
    const validation = validateIdScanDocument(data);
    return {
      ok: validation.ok,
      simulated: false,
      message: validation.ok
        ? `${device.name} — tarama başarılı (güven %${validation.score})`
        : `${device.name} — tarama tamamlandı, doğrulama hatası var`,
      data,
      deviceId: device.id,
      deviceName: device.name,
      validation,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Kimlikokur gateway: ${e instanceof Error ? e.message : 'bağlantı hatası'}`,
    };
  }
}

export async function loadIdReaderConfig(): Promise<IdReaderConfig> {
  const stored = await loadJsonConfig(FILE, DEFAULT_ID_READER_CONFIG);
  return { ...DEFAULT_ID_READER_CONFIG, ...stored };
}

export async function saveIdReaderConfig(config: IdReaderConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testIdReaderConnection(config = DEFAULT_ID_READER_CONFIG): Promise<IdScanResult> {
  if (!config.enabled) return { ok: false, message: 'Kimlik okuyucu kapalı' };
  const active = config.devices.filter((d) => d.enabled).length;
  if (gatewayBaseUrl()) {
    const probe = await probeLiveGateway('ROOMIO_ID_READER_GATEWAY_URL', 'Kimlikokur');
    if (!probe.simulated || !effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
    }
  }
  return { ok: true, simulated: true, message: `Simülasyon — ${active} cihaz hazır` };
}

export async function scanIdDocument(
  deviceId?: string,
  reservationId?: string,
): Promise<IdScanResult> {
  const config = await loadIdReaderConfig();
  if (!config.enabled) return { ok: false, message: 'Kimlik okuyucu kapalı' };

  const device = deviceId
    ? config.devices.find((d) => d.id === deviceId && d.enabled)
    : config.devices.find((d) => d.enabled);
  if (!device) return { ok: false, message: 'Aktif cihaz bulunamadı' };

  if (gatewayBaseUrl()) {
    const result = await scanViaKimlikokurGateway(device, reservationId);
    if (result.ok || !effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return result;
    }
    // Gateway unreachable/failed and simulation fallback is allowed — fall through to demo.
  }

  const data = demoDocument();
  const validation = validateIdScanDocument(data);
  return {
    ok: validation.ok,
    simulated: true,
    message: `Simülasyon: ${device.name} tarama başarılı (güven %${validation.score})`,
    data,
    deviceId: device.id,
    deviceName: device.name,
    validation,
  };
}

export async function getIdReaderPublicConfig(): Promise<
  Pick<
    IdReaderConfig,
    | 'enabled'
    | 'autoFillOnCheckIn'
    | 'requireManualApproval'
    | 'blockCheckInUntilReady'
    | 'autoSendEgmAfterCheckIn'
  > & { deviceCount: number }
> {
  const config = await loadIdReaderConfig();
  return {
    enabled: config.enabled,
    autoFillOnCheckIn: config.autoFillOnCheckIn,
    requireManualApproval: config.requireManualApproval,
    blockCheckInUntilReady: config.blockCheckInUntilReady,
    autoSendEgmAfterCheckIn: config.autoSendEgmAfterCheckIn,
    deviceCount: config.devices.filter((d) => d.enabled).length,
  };
}
