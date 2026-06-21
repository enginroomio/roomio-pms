import {
  authUserToRoom,
  eventToLogFields,
  parseBridgePayload,
  type ParsedBridgeEvent,
} from '@/lib/integrations/hotspot5651/parsers';
import {
  appendHotspotLog,
  closeHotspotSession,
  enrichProvisionedSession,
  findActiveSessions,
  loadHotspot5651Config,
  updateHotspotSession,
} from '@/lib/integrations/hotspot5651/server';
import type { Hotspot5651Config, HotspotSessionLog } from '@/lib/integrations/hotspot5651/types';

export type IngestResult = {
  ok: boolean;
  action?: string;
  logId?: string;
  message: string;
};

export async function ingestBridgeEvent(
  provider: Hotspot5651Config['provider'],
  payload: { line?: string; radius?: Record<string, unknown>; format?: string },
): Promise<IngestResult> {
  const config = await loadHotspot5651Config();
  if (!config.enabled || !config.bridgeEnabled) {
    return { ok: false, message: '5651 köprü kapalı' };
  }

  const event = parseBridgePayload(provider, payload);
  if (!event) return { ok: false, message: 'Parse edilemedi' };

  const source: HotspotSessionLog['source'] = payload.radius ? 'radius' : 'syslog';
  return applyBridgeEvent(event, source);
}

async function applyBridgeEvent(
  event: ParsedBridgeEvent,
  source: HotspotSessionLog['source'],
): Promise<IngestResult> {
  const authUser = event.authUser;

  if (event.action === 'stop' && authUser) {
    const room = authUserToRoom(authUser);
    const sessions = await findActiveSessions({ authUser, roomNo: room ?? undefined });
    for (const s of sessions) {
      await closeHotspotSession(s.id, event.endedAt);
    }
    return {
      ok: true,
      action: 'stop',
      message: sessions.length ? `${sessions.length} oturum kapatıldı` : 'Aktif oturum yok',
    };
  }

  if (event.action === 'update' && authUser) {
    const updated = await updateHotspotSession(authUser, {
      bytesIn: event.bytesIn,
      bytesOut: event.bytesOut,
      internalIp: event.internalIp,
      macAddress: event.macAddress,
    });
    if (updated) return { ok: true, action: 'update', logId: updated.id, message: 'Oturum güncellendi' };
    return { ok: false, message: 'Güncellenecek oturum yok' };
  }

  if (event.action === 'start') {
    if (authUser) {
      const enriched = await enrichProvisionedSession(authUser, {
        macAddress: event.macAddress,
        internalIp: event.internalIp,
        internalPort: event.internalPort,
        externalIp: event.externalIp,
        externalPort: event.externalPort,
        hotspotZone: event.hotspotZone,
        bytesIn: event.bytesIn,
        bytesOut: event.bytesOut,
      });
      if (enriched) {
        return { ok: true, action: 'enrich', logId: enriched.id, message: 'Provizyon oturumu aktifleştirildi' };
      }
    }

    const fields = eventToLogFields(event, source);
    if (!fields) return { ok: false, message: 'Log alanları oluşturulamadı' };
    const log = await appendHotspotLog(fields);
    return { ok: true, action: 'start', logId: log.id, message: 'Yeni oturum kaydı' };
  }

  return { ok: false, message: 'Bilinmeyen olay' };
}

export { parseBridgePayload, SAMPLE_SYSLOG_LINES } from '@/lib/integrations/hotspot5651/parsers';
