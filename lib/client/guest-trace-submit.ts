'use client';

import { roomioFetch } from '@/lib/client/api';
import type { GuestTrace } from '@/lib/server/guest-traces';
import { enqueueSync, isOnline } from '@/lib/sync/engine';

export type GuestTracePayload = {
  guest: string;
  roomNo: string;
  subject: string;
  due: string;
  assignee: string;
  date?: string;
  status?: 'Açık' | 'Tamamlandı';
  notes?: string;
  id?: string;
};

export type GuestTraceSubmitResult = {
  ok: boolean;
  queued: boolean;
  trace?: GuestTrace;
};

function pendingTrace(payload: GuestTracePayload, id: string): GuestTrace {
  return {
    id,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    guest: payload.guest,
    roomNo: payload.roomNo,
    subject: payload.subject,
    due: payload.due,
    status: payload.status ?? 'Açık',
    assignee: payload.assignee,
    notes: payload.notes,
  };
}

export async function submitGuestTrace(payload: GuestTracePayload): Promise<GuestTraceSubmitResult> {
  const body = {
    ...payload,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status: payload.status ?? 'Açık',
  };

  if (!isOnline()) {
    const id = payload.id ?? `gt-pending-${crypto.randomUUID().slice(0, 12)}`;
    await enqueueSync({
      entity: 'guest_trace',
      operation: 'create',
      entityId: id,
      payload: { ...body, id },
    });
    return { ok: true, queued: true, trace: pendingTrace(body, id) };
  }

  const res = await roomioFetch('/api/guest-traces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const data = (await res.json()) as { trace: GuestTrace };
    return { ok: true, queued: false, trace: data.trace };
  }

  const id = payload.id ?? `gt-pending-${crypto.randomUUID().slice(0, 12)}`;
  await enqueueSync({
    entity: 'guest_trace',
    operation: 'create',
    entityId: id,
    payload: { ...body, id },
  });
  return { ok: true, queued: true, trace: pendingTrace(body, id) };
}
