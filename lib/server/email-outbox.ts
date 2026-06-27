import { appendAuditLog } from '@/lib/server/audit-log';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type EmailOutboxEntry = {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachment?: string;
  status: 'queued' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  createdAt: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachment: string | null;
  status: string;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}): EmailOutboxEntry {
  return {
    id: r.id,
    to: r.to,
    subject: r.subject,
    body: r.body,
    attachment: r.attachment ?? undefined,
    status: r.status as EmailOutboxEntry['status'],
    sentAt: r.sentAt ?? undefined,
    error: r.error ?? undefined,
    createdAt: r.createdAt,
  };
}

async function deliverViaWebhook(entry: EmailOutboxEntry): Promise<{ ok: boolean; error?: string }> {
  const webhook = process.env.ROOMIO_MAIL_WEBHOOK?.trim();
  if (!webhook) return { ok: false, error: 'ROOMIO_MAIL_WEBHOOK tanımlı değil' };

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: entry.to,
        subject: entry.subject,
        body: entry.body,
        attachment: entry.attachment,
        id: entry.id,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { ok: false, error: `Webhook HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Webhook hatası' };
  }
}

export async function queueAndDeliverEmailServer(
  data: {
    to: string;
    subject: string;
    body: string;
    attachment?: string;
    user?: string;
  },
  propertyId?: string,
): Promise<EmailOutboxEntry> {
  await init();
  const prop = pid(propertyId);
  const id = `mail-${Date.now()}`;
  const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const draft: EmailOutboxEntry = {
    id,
    to: data.to,
    subject: data.subject,
    body: data.body,
    attachment: data.attachment,
    status: 'queued',
    createdAt,
  };

  await prisma.emailOutbox.create({
    data: {
      id,
      propertyId: prop,
      to: data.to,
      subject: data.subject,
      body: data.body,
      attachment: data.attachment ?? null,
      status: 'queued',
      createdAt,
    },
  });

  const delivery = await deliverViaWebhook(draft);
  const sentAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const status = delivery.ok ? 'sent' : 'queued';
  const error = delivery.ok ? null : delivery.error ?? null;

  const row = await prisma.emailOutbox.update({
    where: { id },
    data: {
      status,
      sentAt: delivery.ok ? sentAt : null,
      error,
    },
  });

  await appendAuditLog({
    module: 'eod',
    action: delivery.ok ? 'email_sent' : 'email_queued',
    entityType: 'EmailOutbox',
    entityId: id,
    user: data.user ?? 'Sistem',
    detail: `${data.subject} → ${data.to}${error ? ` (${error})` : ''}`,
  }, prop);

  return mapRow(row);
}
