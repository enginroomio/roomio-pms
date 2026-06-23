import webpush from 'web-push';
import { listPushSubscriptions, pushConfigured, removePushSubscription } from '@/lib/server/push-store';

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:hk@roomio.local';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendHkPush(payload: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  roomNo?: string;
  hkStatus?: string;
  eventType?: string;
  faultId?: string;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  return sendRolePush('hk', payload);
}

export async function sendRolePush(
  roles: string | string[],
  payload: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
    roomNo?: string;
    hkStatus?: string;
    eventType?: string;
    faultId?: string;
  },
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!pushConfigured() || !configureVapid()) {
    return { sent: 0, failed: 0, errors: ['VAPID yapılandırılmamış'] };
  }

  const roleList = Array.isArray(roles) ? roles : [roles];
  const allSubs = await listPushSubscriptions();
  const subs = allSubs.filter((sub) => {
    if (!sub.role) return roleList.includes('hk');
    return roleList.includes(sub.role);
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag ?? 'roomio-hk',
    data: {
      url: payload.url ?? '/housekeeping/mobile',
      eventType: payload.eventType,
      faultId: payload.faultId,
      ...(payload.roomNo ? { roomNo: payload.roomNo } : {}),
      ...(payload.hkStatus ? { hkStatus: payload.hkStatus } : {}),
    },
  });

  const seen = new Set<string>();
  for (const sub of subs) {
    if (seen.has(sub.endpoint)) continue;
    seen.add(sub.endpoint);
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        data,
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      const status = err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : 0;
      const message = err instanceof Error ? err.message : 'push failed';
      errors.push(message);
      if (status === 400 || status === 401 || status === 403 || status === 404 || status === 410) {
        await removePushSubscription(sub.endpoint);
      }
    }
  }
  return { sent, failed, errors };
}
