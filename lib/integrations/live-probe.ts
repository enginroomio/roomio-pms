/**
 * Opsiyonel canlı gateway sağlık kontrolü.
 * ROOMIO_INTEGRATION_LIVE=1 ve ilgili *_GATEWAY_URL tanımlıysa HTTP ping yapar.
 */

export type LiveProbeResult = {
  ok: boolean;
  simulated: boolean;
  message: string;
  statusCode?: number;
};

export async function probeLiveGateway(
  envKey: string,
  label: string,
): Promise<LiveProbeResult> {
  const url = process.env[envKey]?.trim();
  if (!url) {
    return { ok: true, simulated: true, message: `${label}: gateway URL tanımlı değil (simülasyon)` };
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        ok: false,
        simulated: false,
        message: `${label}: gateway HTTP ${res.status}`,
        statusCode: res.status,
      };
    }
    return {
      ok: true,
      simulated: false,
      message: `${label}: canlı gateway erişilebilir`,
      statusCode: res.status,
    };
  } catch (e) {
    return {
      ok: false,
      simulated: false,
      message: `${label}: ${e instanceof Error ? e.message : 'bağlantı hatası'}`,
    };
  }
}

export const LIVE_GATEWAY_ENV_KEYS = {
  channel: 'ROOMIO_CHANNEL_GATEWAY_URL',
  booking: 'ROOMIO_BOOKING_GATEWAY_URL',
  efatura: 'ROOMIO_EFATURA_GATEWAY_URL',
  guestPortal: 'ROOMIO_GUEST_PORTAL_GATEWAY_URL',
  whatsapp: 'ROOMIO_WHATSAPP_GATEWAY_URL',
  reputation: 'ROOMIO_REPUTATION_GATEWAY_URL',
  banking: 'ROOMIO_BANKING_GATEWAY_URL',
  tourOperator: 'ROOMIO_TOUR_OPERATOR_GATEWAY_URL',
  viofun: 'ROOMIO_VIOFUN_GATEWAY_URL',
  ai: 'ROOMIO_AI_GATEWAY_URL',
  marina: 'ROOMIO_MARINA_GATEWAY_URL',
  hrPortal: 'ROOMIO_HR_PORTAL_GATEWAY_URL',
  virtualPos: 'ROOMIO_VIRTUAL_POS_GATEWAY_URL',
  googleBackup: 'ROOMIO_GOOGLE_BACKUP_GATEWAY_URL',
  eDispatch: 'ROOMIO_EDISPATCH_GATEWAY_URL',
  idReader: 'ROOMIO_ID_READER_GATEWAY_URL',
} as const;
