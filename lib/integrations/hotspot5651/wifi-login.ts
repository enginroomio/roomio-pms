import { roomToAuthUser } from '@/lib/integrations/hotspot5651/parsers';
import {
  appendHotspotLog,
  enrichProvisionedSession,
  findActiveSessions,
  loadHotspot5651Config,
  validateGuestWifiLogin,
} from '@/lib/integrations/hotspot5651/server';

export type GuestWifiLoginRequest = {
  roomNo: string;
  password: string;
  macAddress?: string;
  clientIp?: string;
  userAgent?: string;
  kvkkAccepted?: boolean;
};

export async function handleGuestWifiLogin(req: GuestWifiLoginRequest): Promise<{
  ok: boolean;
  message: string;
  guestName?: string;
  authUser?: string;
}> {
  const config = await loadHotspot5651Config();
  if (!config.enabled) return { ok: false, message: 'WiFi hizmeti şu an kullanılamıyor' };
  if (!config.captivePortalEnabled) return { ok: false, message: 'Captive portal kapalı' };
  if (config.requireGuestAuth && !req.kvkkAccepted) {
    return { ok: false, message: 'Kullanım koşullarını onaylamanız gerekir' };
  }

  const cred = await validateGuestWifiLogin(req.roomNo.trim(), req.password);
  if (!cred) {
    return { ok: false, message: 'Oda numarası veya WiFi şifresi hatalı' };
  }

  const authUser = roomToAuthUser(req.roomNo);
  const mac = req.macAddress?.toUpperCase().replace(/-/g, ':') ?? 'PENDING';
  const ip = req.clientIp ?? '0.0.0.0';

  const enriched = await enrichProvisionedSession(authUser, {
    macAddress: mac !== 'PENDING' ? mac : undefined,
    internalIp: ip !== '0.0.0.0' ? ip : undefined,
    hotspotZone: 'Captive-Portal',
  });

  if (!enriched) {
    const existing = await findActiveSessions({ authUser });
    if (!existing.length) {
      await appendHotspotLog({
        startedAt: new Date().toISOString(),
        endedAt: null,
        internalIp: ip,
        internalPort: 0,
        externalIp: '0.0.0.0',
        externalPort: 0,
        macAddress: mac,
        bytesIn: 0,
        bytesOut: 0,
        guestName: cred.guestName,
        guestIdType: 'room_guest',
        guestIdRaw: authUser,
        roomNo: req.roomNo,
        reservationId: cred.reservationId,
        authUser,
        source: 'api',
        userAgent: req.userAgent ?? null,
        hotspotZone: 'Captive-Portal',
        provisioned: false,
      });
    }
  }

  return {
    ok: true,
    message: 'İnternete bağlandınız. İyi konaklamalar!',
    guestName: cred.guestName,
    authUser,
  };
}
