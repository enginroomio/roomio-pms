import type { InfoRackRow } from '@/lib/data/guest-relations';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getAllReservationsServer, init } from '@/lib/server/pms-store';
import { getVipGuestsServer } from '@/lib/server/vip-guests';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function guestTitle(name: string, extra?: Record<string, string>): string {
  if (extra?.title) return extra.title;
  if (/^(Ms|Mrs|Miss)\b/i.test(name)) return 'Mrs';
  if (/^Mr\b/i.test(name)) return 'Mr';
  return 'Mr';
}

export async function getInfoRackServer(propertyId?: string): Promise<InfoRackRow[]> {
  await init();
  const prop = pid(propertyId);
  const [reservations, vips] = await Promise.all([
    getAllReservationsServer(prop),
    getVipGuestsServer(prop),
  ]);

  const vipByRoom = new Set(
    vips
      .filter((v) => v.status === 'Konaklıyor')
      .map((v) => v.room.replace(/\s*\([^)]*\)/, '').trim()),
  );

  return reservations
    .filter((r) => r.status === 'CHECKED_IN' && r.roomNo)
    .sort((a, b) => (a.roomNo ?? '').localeCompare(b.roomNo ?? '', 'tr'))
    .map((r) => {
      const extra = (r as { extraData?: Record<string, string> }).extraData ?? {};
      const nationality = extra.nationality ?? extra.nationalityCode ?? 'TR';
      const language = extra.language ?? (nationality === 'TR' ? 'TR' : 'EN');
      const isVip = vipByRoom.has(r.roomNo!) || extra.vip === '1';
      const noteParts = [r.notes, isVip ? 'VIP' : ''].filter(Boolean);
      return {
        id: r.id,
        roomNo: r.roomNo!,
        guestName: r.guestName,
        title: guestTitle(r.guestName, extra),
        language,
        notes: noteParts.join(' · ') || '—',
      };
    });
}
