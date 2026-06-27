import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { archiveToFormValues, type GuestArchiveEntry } from '@/lib/egm/guest-archive';

export type GuestArchiveListItem = GuestArchiveEntry & {
  masked?: boolean;
  idNoMasked?: string;
};

export async function applyGuestArchiveEntry(archiveId: string): Promise<GuestArchiveEntry | null> {
  const res = await roomioFetch('/api/guests/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'apply', archiveId }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Arşiv kaydı açılamadı'));
  }
  const j = (await res.json()) as { entry?: GuestArchiveEntry };
  return j.entry ?? null;
}

export function patchFromArchiveEntry(entry: GuestArchiveEntry): Record<string, string | number> {
  return archiveToFormValues(entry);
}
