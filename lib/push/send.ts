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
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!pushConfigured() || !configureVapid()) {
    return { sent: 0, failed: 0, errors: ['VAPID yapılandırılmamış'] };
  }

  const subs = await listPushSubscriptions();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag ?? 'roomio-hk',
    data: { url: payload.url ?? '/housekeeping/mobile' },
  });

  for (const sub of subs) {
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
      if (status === 404 || status === 410) {
        await removePushSubscription(sub.endpoint);
      }
    }
  }
  return { sent, failed, errors };
}
